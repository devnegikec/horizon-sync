import { CardFooter } from '@horizon-sync/ui/components/ui/card';

export function LoginFooter() {
  return (
    <CardFooter className="flex flex-col space-y-4 text-center text-muted-foreground">
      <div className="text-xs space-y-1">
        <p>Copyright © 2026 Ciphercode. All rights reserved</p>
        <div className="flex justify-center gap-2">
          <a href="/terms" className="hover:underline">Terms & Conditions</a>
          <span>and</span>
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
        </div>
      </div>
      <div className="text-sm">
        Don&apos;t have an account? <a href="/register" className="text-[#3058EE] hover:underline font-medium">Sign up</a>
      </div>
    </CardFooter>
  );
}
