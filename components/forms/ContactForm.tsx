"use client";

/**
 * @file components/forms/ContactForm.tsx
 * @description React component for ContactForm.tsx under the forms category.
 * 
 * @exports
 * - ContactForm (default): Main React component or function
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { contactSchema, type ContactInput } from "@/lib/validations";
import { getVisitorId } from "@/lib/analytics";
import { useState, useRef, useEffect } from "react";

function FloatingField({
  id,
  label,
  error,
  multiline,
  inputProps,
}: {
  id: string;
  label: string;
  error?: string;
  multiline?: boolean;
  inputProps: React.InputHTMLAttributes<HTMLInputElement> &
    React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}) {
  const [filled, setFilled] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  // keep filled state in sync with RHF reset
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new MutationObserver(() => {
      setFilled(el.value.length > 0);
    });
    observer.observe(el, { attributes: true, attributeFilter: ["value"] });
    return () => observer.disconnect();
  }, []);

  const raised = focused || filled;

  const baseStyle: React.CSSProperties = {
    border: "none",
    borderBottom: `1px solid ${focused ? "var(--amber)" : "var(--border)"}`,
    background: "transparent",
    color: "var(--text-primary)",
    fontFamily: "var(--font-inter), Inter, sans-serif",
    fontSize: "15px",
    padding: "1.25rem 0 0.75rem",
    width: "100%",
    outline: "none",
    resize: "none",
    transition: "border-bottom-color 0.2s",
    borderRadius: 0,
  };

  const sharedEvents = {
    onFocus: () => setFocused(true),
    onBlur: (e: React.FocusEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      setFocused(false);
      setFilled(e.target.value.length > 0);
      inputProps.onBlur?.(e);
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      setFilled(e.target.value.length > 0);
      inputProps.onChange?.(e);
    },
  };

  return (
    <div style={{ position: "relative", paddingTop: "0.5rem" }}>
      <label
        htmlFor={id}
        style={{
          position: "absolute",
          top: raised ? "-0.1rem" : "1.3rem",
          left: 0,
          fontSize: raised ? "10px" : "14px",
          color: raised ? "var(--amber)" : "var(--text-muted)",
          letterSpacing: raised ? "0.1em" : "0",
          transition: "all 0.2s ease",
          pointerEvents: "none",
          userSelect: "none",
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontWeight: 400,
          textTransform: raised ? "uppercase" : "none",
          zIndex: 1,
        }}
      >
        {label}
      </label>

      {multiline ? (
        <textarea
          id={id}
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          style={{ ...baseStyle, minHeight: "120px" }}
          onFocus={sharedEvents.onFocus}
          onBlur={sharedEvents.onBlur as React.FocusEventHandler<HTMLTextAreaElement>}
          onChange={sharedEvents.onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
        />
      ) : (
        <input
          id={id}
          ref={ref as React.RefObject<HTMLInputElement>}
          {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
          style={baseStyle}
          onFocus={sharedEvents.onFocus}
          onBlur={sharedEvents.onBlur as React.FocusEventHandler<HTMLInputElement>}
          onChange={sharedEvents.onChange as React.ChangeEventHandler<HTMLInputElement>}
        />
      )}

      {error && (
        <p style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", fontFamily: "var(--font-inter), Inter, sans-serif" }}>
          {error}
        </p>
      )}
    </div>
  );
}

type SubmitState = "idle" | "submitting" | "success";

export default function ContactForm() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data: ContactInput): Promise<void> => {
    setSubmitState("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          visitorId: getVisitorId(),
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSubmitState("success");
      toast.success("Message sent! I'll get back to you soon.");
      reset();
      setTimeout(() => setSubmitState("idle"), 4000);
    } catch {
      setSubmitState("idle");
      toast.error("Something went wrong. Please try again.");
    }
  };

  const btnStyle: React.CSSProperties = {
    width: "100%",
    background:
      submitState === "success"
        ? "var(--green)"
        : submitState === "submitting"
        ? "var(--amber)"
        : "var(--amber)",
    color: submitState === "success" ? "#fff" : "#000",
    fontFamily: "var(--font-syne), Syne, sans-serif",
    fontWeight: 700,
    fontSize: "14px",
    letterSpacing: "0.15em",
    padding: "1.25rem",
    border: "none",
    borderRadius: 0,
    cursor: submitState === "submitting" ? "not-allowed" : "pointer",
    opacity: submitState === "submitting" ? 0.7 : 1,
    marginTop: "2rem",
    transition: "background 0.2s, color 0.2s",
  };

  const btnLabel =
    submitState === "success"
      ? "MESSAGE SENT ✓"
      : submitState === "submitting"
      ? "SENDING..."
      : "SEND IT →";

  const nameReg = register("name");
  const emailReg = register("email");
  const subjectReg = register("subject");
  const messageReg = register("message");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <FloatingField
        id="contact-name"
        label="Your name"
        error={errors.name?.message}
        inputProps={nameReg}
      />
      <FloatingField
        id="contact-email"
        label="your@email.com"
        error={errors.email?.message}
        inputProps={{ ...emailReg, type: "email" }}
      />
      <FloatingField
        id="contact-subject"
        label="What's this about?"
        error={errors.subject?.message}
        inputProps={subjectReg}
      />
      <FloatingField
        id="contact-message"
        label="Tell me everything..."
        multiline
        error={errors.message?.message}
        inputProps={messageReg}
      />

      <button
        type="submit"
        disabled={submitState !== "idle"}
        style={btnStyle}
        onMouseEnter={(e) => {
          if (submitState === "idle") {
            (e.currentTarget as HTMLButtonElement).style.background = "#fff";
            (e.currentTarget as HTMLButtonElement).style.color = "#000";
          }
        }}
        onMouseLeave={(e) => {
          if (submitState === "idle") {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--amber)";
            (e.currentTarget as HTMLButtonElement).style.color = "#000";
          }
        }}
      >
        {btnLabel}
      </button>
      <p style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        marginTop: '0.75rem',
        fontFamily: 'Inter',
      }}>
        By submitting this form you agree to our{' '}
        <a href="/terms" style={{ color: 'var(--amber)' }}>Terms</a>
        {' '}and{' '}
        <a href="/privacy" style={{ color: 'var(--amber)' }}>
          Privacy Policy
        </a>.
      </p>
    </form>
  );
}
