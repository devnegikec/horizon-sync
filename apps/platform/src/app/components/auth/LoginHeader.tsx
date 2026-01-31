import { CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import logo from '../../../assets/ciphercode_logo.png';

export function LoginHeader() {
  return (
    <CardHeader className="space-y-1 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <img src={logo} alt="Logo" className="h-15 w-15 object-contain" />
        <span className="font-bold text-4xl bg-gradient-to-r from-[#3058EE] to-[#7D97F6] bg-clip-text text-transparent">Horizon Sync</span>
      </div>
      <CardTitle className="text-2xl">Welcome back</CardTitle>
      <CardDescription>Sign in to your account to continue</CardDescription>
    </CardHeader>
  );
}
