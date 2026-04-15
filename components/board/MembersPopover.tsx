import { User } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Popover } from "@/components/ui/Popover";

export function MembersPopover({ members }: { members: Array<{ id: string; member: { id: string; name: string; avatarUrl: string | null } }> }) {
  return (
    <Popover
      trigger={
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-white/72 transition-colors hover:bg-white/10 hover:text-white"
        >
          <User className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">Members</span>
        </button>
      }
      title="Members"
      contentClassName="w-48"
      side="bottom"
      align="end"
    >
        {members.length === 0 ? (
          <p className="text-white/52 text-sm">No members assigned</p>
        ) : (
          <div className="space-y-2">
            {members.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2">
                <Avatar
                  src={entry.member.avatarUrl}
                  name={entry.member.name}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-white">{entry.member.name}</p>
                  <p className="text-xs text-white/52">Member</p>
                </div>
              </div>
            ))}
          </div>
        )}
    </Popover>
  );
}
