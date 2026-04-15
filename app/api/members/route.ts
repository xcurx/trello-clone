import { memberService } from "@/lib/services/member.service";
import { success, serverError } from "@/lib/api-response";

export async function GET() {
  try {
    const members = await memberService.getAll();
    return success(members);
  } catch (err) {
    return serverError(err);
  }
}
