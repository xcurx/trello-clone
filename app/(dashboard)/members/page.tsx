import { UserPlus, MoreHorizontal, Settings, Crown, Mail } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Popover } from "@/components/ui/Popover";

export default function MembersPage() {
  const members = [
    {
      id: "1",
      name: "Trello User",
      email: "cx@example.com",
      role: "Workspace admin",
      joined: "Jan 2026",
    },
    {
      id: "2",
      name: "Guest Collaborator",
      email: "guest@example.com",
      role: "Normal",
      joined: "Mar 2026",
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-10 h-full w-full">
        {/* Header */}
        <div className="border-b border-outline-variant/30 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-on-surface mb-2">Workspace members ({members.length})</h1>
            <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Workspace members can view and join all Workspace visible boards and create new boards in the Workspace.
            </p>
          </div>
          
          <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap shrink-0">
            <UserPlus className="w-4 h-4" />
            Invite workspace members
          </button>
        </div>

        {/* Content Tabs (Mock) */}
        <div className="flex gap-6 border-b border-outline-variant/30 mb-6">
          <button className="text-primary font-medium text-sm pb-2 border-b-2 border-primary">
            Workspace members
          </button>
          <button className="text-on-surface-variant hover:text-on-surface font-medium text-sm pb-2 border-b-2 border-transparent transition-colors">
            Guests
          </button>
          <button className="text-on-surface-variant hover:text-on-surface font-medium text-sm pb-2 border-b-2 border-transparent transition-colors">
            Pending
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input 
            type="text" 
            placeholder="Filter by name..." 
            className="w-full max-w-xs text-sm border-2 border-[#091e4224] focus:border-primary rounded-sm p-2 outline-none bg-surface transition-colors"
          />
        </div>

        {/* Members List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface mb-4">Workspace members</h2>
          
          <div className="border border-outline-variant/30 rounded-md divide-y divide-outline-variant/30 overflow-hidden bg-surface">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-surface-container-lowest transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <Avatar name={member.name} size="lg" className="w-12 h-12 text-base" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base text-on-surface">{member.name}</span>
                      {member.role === "Workspace admin" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                          <Crown className="w-3 h-3 text-primary" /> Admin
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-on-surface-variant">{member.email}</span>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 shrink-0">
                  <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-sm text-sm border border-outline-variant/20 hover:bg-surface-container transition-colors cursor-pointer w-full sm:w-auto justify-center">
                    <span className="font-medium text-on-surface">{member.role}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                    <Popover
                      trigger={
                        <button className="bg-surface-container-low hover:bg-surface-container p-1.5 rounded-sm text-on-surface-variant transition-colors border border-outline-variant/20">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      }
                      align="end"
                      side="bottom"
                    >
                      <div className="w-48 py-1 space-y-1">
                        <button className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2">
                           <Mail className="w-4 h-4 text-on-surface-variant" />
                           Resend invite
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm text-[#c9372c] hover:bg-[#c9372c]/10 transition-colors flex items-center gap-2">
                           <Settings className="w-4 h-4" />
                           Remove from workspace
                        </button>
                      </div>
                    </Popover>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
