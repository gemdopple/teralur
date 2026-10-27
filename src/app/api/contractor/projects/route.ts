import { requirePeran } from "@/lib/identitas";
import { adminErrorResponse, jsonOk } from "@/lib/admin-http";
import { proyekUntukKontraktor } from "@/lib/kontraktor-proyek";

// Proyek milik kontraktor yang sedang masuk. Penyaringan dilakukan di server
// memakai contractor_id dari profil akun — TIDAK ada parameter permintaan yang
// dapat mengubah cakupannya, sehingga kontraktor tidak mungkin melihat proyek
// kontraktor lain. Admin/pemerintah memakai endpoint proyek mereka sendiri.

export async function GET() {
  try {
    const identitas = await requirePeran("kontraktor");
    const projects = await proyekUntukKontraktor(identitas.contractorId);
    return jsonOk({ projects });
  } catch (error) {
    return adminErrorResponse(error);
  }
}