import { Lock, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrialLockOverlayProps {
  slug: string;
  name?: string;
}

export function TrialLockOverlay({ slug, name }: TrialLockOverlayProps) {
  const waText = encodeURIComponent(
    `Hi, my trial expired for portfolio slug: ${slug}. I want to pay via EasyPaisa.`
  );
  const waUrl = `https://wa.me/923122787385?text=${waText}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="max-w-md mx-4 p-8 rounded-2xl border border-border bg-card text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-destructive" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Trial Expired</h2>
        <p className="text-muted-foreground mb-1">
          Your 7-day free trial for <span className="font-semibold text-foreground">/{slug}</span> has ended.
        </p>
        {name && (
          <p className="text-sm text-muted-foreground mb-6">
            Portfolio owner: {name}
          </p>
        )}

        <div className="space-y-3 mb-6">
          <div className="p-3 rounded-lg bg-muted/50 text-left text-sm">
            <p className="font-medium mb-1">To unlock your portfolio:</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>Send PKR 400 (Starter) or PKR 800 (AI Pro) via EasyPaisa/JazzCash</li>
              <li>Message us on WhatsApp with your portfolio slug</li>
              <li>We activate it within minutes</li>
            </ol>
          </div>
        </div>

        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full gap-2" size="lg">
            <MessageCircle className="w-5 h-5" />
            Unlock Now via WhatsApp
            <ExternalLink className="w-4 h-4 opacity-60" />
          </Button>
        </a>

        <p className="text-xs text-muted-foreground mt-4">
          Or email us at{" "}
          <a href="mailto:zilkjiro@gmail.com" className="text-primary underline">
            zilkjiro@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
