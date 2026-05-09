import { Card } from "@/components/ui/card";
import { UserPlus, MapPin, Calendar, Trophy } from "lucide-react";

export default function ConnectPage() {
  return (
    <div className="max-w-sm mx-auto px-4 py-12 text-center space-y-6">
      <div className="w-20 h-20 bg-brand/10 rounded-3xl flex items-center justify-center mx-auto">
        <UserPlus className="w-10 h-10 text-brand" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Connect with Players</h1>
        <p className="text-muted-foreground mt-2">
          Find players in your city, match by sport and skill level, and set up games together.
        </p>
      </div>

      <Card className="border-brand/20 bg-brand/5">
        <p className="text-lg font-bold text-brand">Coming Soon</p>
        <p className="text-sm text-muted-foreground mt-1">We&apos;re building this feature right now</p>
      </Card>

      <div className="grid grid-cols-3 gap-3 pt-4">
        <div className="text-center">
          <MapPin className="w-6 h-6 text-brand mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Find by City</p>
        </div>
        <div className="text-center">
          <Trophy className="w-6 h-6 text-brand mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Match by Sport</p>
        </div>
        <div className="text-center">
          <Calendar className="w-6 h-6 text-brand mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Set Availability</p>
        </div>
      </div>
    </div>
  );
}
