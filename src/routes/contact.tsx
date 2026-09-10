import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessage } from "@/lib/contact.functions";

const TITLE = "Contact WebWarheads";
const DESCRIPTION =
  "Questions about plans, templates or getting your business website live? Send the WebWarheads team a message.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  business_name: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "Tell us a little more").max(2000),
});

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      business_name: form.get("business_name"),
      message: form.get("message"),
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await submitContactMessage({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          message: parsed.data.message,
          business_name: parsed.data.business_name ?? "",
        },
      });
      setSent(true);
    } catch {
      toast.error("We couldn't send that. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout>
      <section className="border-b border-border bg-navy text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">Talk to us</h1>
          <p className="mt-3 max-w-xl text-base text-navy-foreground/75 sm:text-lg">
            Tell us about your business and what you need. A real person reads every message.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
          {sent ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <h2 className="text-lg font-semibold">Message received</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Thanks — we have your message and will reply to the email address you gave us.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <Label htmlFor="name">Your name</Label>
                <Input id="name" name="name" maxLength={100} className="mt-1.5" />
                {errors["name"] ? (
                  <p className="mt-1 text-xs text-destructive">{errors["name"]}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" maxLength={255} className="mt-1.5" />
                {errors["email"] ? (
                  <p className="mt-1 text-xs text-destructive">{errors["email"]}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="business_name">Business name (optional)</Label>
                <Input id="business_name" name="business_name" maxLength={120} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="message">How can we help?</Label>
                <Textarea id="message" name="message" rows={5} maxLength={2000} className="mt-1.5" />
                {errors["message"] ? (
                  <p className="mt-1 text-xs text-destructive">{errors["message"]}</p>
                ) : null}
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
