import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Contract, FetchRequest, Interface, JsonRpcProvider, Wallet, keccak256, getAddress, Transaction } from "ethers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/log";
import { PROOF_ABI } from "./abi";

type Job = {
  booking_id: string; booking_key: string; proof_hash: string; transaction_hash: string;
  signed_transaction: string; contract_address: string; wallet_address: string;
  state: "pending" | "confirmed" | "failed";
};
type Outcome = { status: "pending" | "confirmed" | "failed" | "configuration_required"; message: string };
const pending = (message = "Proof submitted. Waiting for three blockchain confirmations."): Outcome => ({ status: "pending", message });

/** Administrator only. Fresh role checks apply even when called from a payment approval handler. */
export async function anchorBooking(bookingId: string): Promise<Outcome> {
  const { user } = await requireRole("admin");
  if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { status: "configuration_required", message: "The hotel server's Supabase secret key must be configured locally." };
  }
  const rpc = process.env.AMOY_RPC_URL;
  const key = process.env.SYSTEM_WALLET_PRIVATE_KEY;
  const registry = process.env.PROOF_REGISTRY_ADDRESS;
  if (!rpc || !key || !registry) return {
    status: "configuration_required", message: "Payment approved. The hotel must configure its Amoy wallet and deployed booking contract before confirmation.",
  };
  const db = createAdminClient();
  const token = randomUUID();
  let provider: JsonRpcProvider | undefined;
  let locked = false;
  try {
    const { data: acquired, error: lockError } = await db.rpc("acquire_booking_chain_lease", { p_token: token, p_actor: user.id });
    if (lockError) throw new Error("Cannot acquire blockchain lease.");
    if (!acquired) return pending("Another booking proof is being processed. Check again shortly.");
    locked = true;
    const request = new FetchRequest(rpc);
    request.timeout = 10000;
    provider = new JsonRpcProvider(request, undefined, { batchMaxCount: 1, cacheTimeout: -1 });
    if ((await provider.getNetwork()).chainId !== BigInt(80002)) throw new Error("Wrong chain.");
    const wallet = new Wallet(key, provider);
    const contractAddress = getAddress(registry);
    const contract = new Contract(contractAddress, PROOF_ABI, provider);
    if (getAddress(await contract.registrar()) !== wallet.address) throw new Error("Wrong registrar.");

    const { data: existing, error: readError } = await db.from("booking_chain_jobs").select("*").eq("booking_id", bookingId).maybeSingle();
    if (readError) throw new Error("Cannot read proof job.");
    let job = existing as Job | null;
    if (job?.state === "confirmed") return { status: "confirmed", message: "Booking confirmed. Its proof is recorded on Polygon Amoy." };
    if (job?.state === "failed") return { status: "failed", message: "The blockchain transaction reverted. The booking remains under review; contact the hotel administrator." };

    // Recover a persisted transaction first, even if another booking requested work.
    const { data: outstanding, error: pendingError } = await db.from("booking_chain_jobs").select("*").eq("state", "pending").maybeSingle();
    if (pendingError) throw new Error("Cannot read pending transaction.");
    if (outstanding) job = outstanding as Job;
    if (!job) {
      const { data: booking, error: bookingError } = await db.from("bookings")
        .select("id,reference,room_id,check_in,check_out,guests_count,nightly_rate,total_amount,arrival_time,departure_time,status").eq("id", bookingId).single();
      const { data: payment, error: paymentError } = await db.from("payment_submissions")
        .select("id,status,amount,object_path,reviewed_by,reviewed_at").eq("booking_id", bookingId).single();
      if (bookingError || paymentError || booking.status !== "under_review" || payment.status !== "approved" || Number(payment.amount) !== Number(booking.total_amount)) {
        return { status: "failed", message: "This booking does not have an approved payment ready for blockchain confirmation." };
      }
      const { data: receipt, error: receiptError } = await db.storage.from("payment-proofs").download(payment.object_path);
      if (receiptError || !receipt || receipt.size > 5 * 1024 * 1024) throw new Error("Receipt unavailable.");
      const salt = randomBytes(32).toString("hex");
      const bookingKey = `0x${randomBytes(32).toString("hex")}`;
      // Store this exact canonical text privately; never send the salt or receipt hash to the browser.
      const snapshot = JSON.stringify({ version: 1, salt, bookingKey,
        booking: { id: booking.id, reference: booking.reference, room: booking.room_id, checkIn: booking.check_in,
          checkOut: booking.check_out, arrival: booking.arrival_time, departure: booking.departure_time,
          guests: booking.guests_count, nightlyRate: String(booking.nightly_rate), total: String(booking.total_amount), currency: "USD" },
        payment: { id: payment.id, reviewedBy: payment.reviewed_by, reviewedAt: payment.reviewed_at,
          receiptSha256: createHash("sha256").update(Buffer.from(await receipt.arrayBuffer())).digest("hex") },
      });
      const proofHash = `0x${createHash("sha256").update(snapshot).digest("hex")}`;
      // Dedicated wallet: no manual transactions after deployment. Fail closed if its nonce is already busy.
      const latestNonce = await provider.getTransactionCount(wallet.address, "latest");
      if (latestNonce !== await provider.getTransactionCount(wallet.address, "pending")) return pending("The hotel wallet has another pending transaction. Check again after it confirms.");
      const data = new Interface(PROOF_ABI).encodeFunctionData("anchor", [bookingKey, proofHash]);
      const tx = await wallet.populateTransaction({ to: contractAddress, data, value: BigInt(0), nonce: latestNonce, chainId: 80002 });
      const signed = await wallet.signTransaction(tx);
      const txHash = keccak256(signed);
      const { error: saveError } = await db.rpc("prepare_booking_chain_job", {
        p_token: token, p_actor: user.id, p_booking: bookingId, p_payment: payment.id, p_snapshot: snapshot,
        p_key: bookingKey, p_hash: proofHash, p_contract: contractAddress, p_wallet: wallet.address, p_signed: signed, p_tx: txHash,
      });
      // Never broadcast unless durable storage committed successfully.
      if (saveError) throw new Error("Cannot persist transaction.");
      job = { booking_id: bookingId, booking_key: bookingKey, proof_hash: proofHash, signed_transaction: signed,
        transaction_hash: txHash, contract_address: contractAddress, wallet_address: wallet.address, state: "pending" };
    }
    if (getAddress(job.contract_address) !== contractAddress || getAddress(job.wallet_address) !== wallet.address) throw new Error("Pending job uses different configuration.");
    const signedTx = Transaction.from(job.signed_transaction);
    const iface = new Interface(PROOF_ABI);
    if (signedTx.hash !== job.transaction_hash || signedTx.from !== wallet.address || signedTx.to !== contractAddress || signedTx.chainId !== BigInt(80002) || signedTx.value !== BigInt(0) ||
      signedTx.data !== iface.encodeFunctionData("anchor", [job.booking_key, job.proof_hash])) throw new Error("Stored transaction does not match proof.");
    let chainReceipt = await provider.getTransactionReceipt(job.transaction_hash);
    if (!chainReceipt) {
      // Re-broadcast only the same signed bytes. A timeout must never create a second transaction.
      try { await provider.broadcastTransaction(job.signed_transaction); }
      catch { /* Already-known/temporary RPC errors are reconciled using the stored hash. */ }
      chainReceipt = await provider.getTransactionReceipt(job.transaction_hash);
    }
    if (!chainReceipt || await chainReceipt.confirmations() < 3) return pending();
    if (chainReceipt.hash !== job.transaction_hash || chainReceipt.from !== wallet.address || chainReceipt.to !== contractAddress) throw new Error("Unexpected receipt.");
    const canonicalBlock = await provider.getBlock(chainReceipt.blockNumber);
    if (!canonicalBlock || canonicalBlock.hash !== chainReceipt.blockHash) return pending("The chain is reorganizing. Check again shortly.");
    if (chainReceipt.status === 1) {
      const matched = chainReceipt.logs.some(log => {
        if (getAddress(log.address) !== contractAddress) return false;
        try { const event = iface.parseLog(log); return event?.name === "BookingAnchored" && event.args[0] === job.booking_key && event.args[1] === job.proof_hash; }
        catch { return false; }
      });
      if (!matched || await contract.proofs(job.booking_key) !== job.proof_hash) throw new Error("Proof event mismatch.");
    } else if (chainReceipt.status !== 0) throw new Error("Unknown receipt state.");
    const { error: finishError } = await db.rpc("finish_booking_chain_job", {
      p_token: token, p_actor: user.id, p_booking: job.booking_id, p_tx: job.transaction_hash,
      p_block: chainReceipt.blockNumber, p_success: chainReceipt.status === 1,
    });
    if (finishError) throw new Error("Cannot finalize proof.");
    if (job.booking_id !== bookingId) return pending("The previous booking transaction was reconciled. Check again to process this booking.");
    return chainReceipt.status === 1
      ? { status: "confirmed", message: "Booking confirmed. Its proof is recorded on Polygon Amoy." }
      : { status: "failed", message: "The transaction reverted. The booking remains under review; contact the hotel administrator." };
  } catch {
    // Never log an ethers error: it may contain the RPC credential or signed payload.
    logError("booking.chain", new Error("Booking proof processing could not complete."));
    return pending("Blockchain processing is not complete. Check the server configuration and test POL, then use Check blockchain proof. Your payment approval is saved.");
  } finally {
    if (locked) await db.rpc("release_booking_chain_lease", { p_token: token });
    provider?.destroy();
  }
}
