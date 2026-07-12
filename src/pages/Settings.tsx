import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2, Bell, Shield, Paintbrush } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto pb-10">
      <PageHeader 
        title="Settings" 
        description="Configure your platform preferences and integrations."
      />
      <div className="p-6 sm:p-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-white/[0.06] bg-card/50 glass hover:bg-card/80 transition-colors cursor-pointer">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">General Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">Manage company details, localization, and default preferences.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-white/[0.06] bg-card/50 glass hover:bg-card/80 transition-colors cursor-pointer">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">Configure email, SMS, and in-app alert thresholds.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-white/[0.06] bg-card/50 glass hover:bg-card/80 transition-colors cursor-pointer">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Security & Privacy</h3>
              <p className="text-sm text-muted-foreground mt-1">Manage password policies, SSO, and 2FA settings.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-white/[0.06] bg-card/50 glass hover:bg-card/80 transition-colors cursor-pointer">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 bg-purple-500/10 rounded-full flex items-center justify-center shrink-0">
              <Paintbrush className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Appearance</h3>
              <p className="text-sm text-muted-foreground mt-1">Customize themes, colors, and branding elements.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
