"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContactFormProps {
  professionalId: string;
  professionalName: string;
}

export default function ContactForm({ professionalId: _professionalId, professionalName }: ContactFormProps) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // In production this would send an email. For now just simulate.
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
        Message sent! {professionalName} will be in touch soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Your Name</Label>
        <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your name" className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Email</Label>
        <Input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com" className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Message</Label>
        <Textarea required value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Tell them about your session..." rows={3} className="text-sm" />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
