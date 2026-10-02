"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiUser, FiMessageSquare, FiPhone, FiBriefcase, FiHome, FiSend, FiX, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const buildInputStyle = (focused: boolean) => ({
  background: focused
    ? `
        radial-gradient(120% 150% at 50% -10%, rgba(255,255,255,0.1) 0%, transparent 60%),
        linear-gradient(180deg, rgba(15,122,163,0.75) 0%, rgba(10,104,140,0.82) 100%)
      `
    : `
        radial-gradient(120% 150% at 50% -10%, rgba(255,255,255,0.06) 0%, transparent 60%),
        linear-gradient(180deg, rgba(15,122,163,0.55) 0%, rgba(10,104,140,0.65) 100%)
      `,
  border: focused ? "1px solid rgba(56,189,248,0.35)" : "1px solid rgba(255,255,255,0.1)",
  boxShadow: focused
    ? `
        0 1px 0 rgba(255,255,255,0.12) inset,
        0 0 0 3px rgba(56,189,248,0.12),
        0 10px 28px -14px rgba(0,0,0,0.45)
      `
    : `
        0 1px 0 rgba(255,255,255,0.06) inset,
        0 8px 22px -12px rgba(0,0,0,0.3)
      `,
  transition: "all 0.25s cubic-bezier(.2,.8,.2,1)",
});

const InputField = ({
  id,
  label,
  placeholder,
  icon: Icon,
  name,
  type = "text",
  required = false,
  rows,
  delay = 0,
}: {
  id: string;
  label: string;
  placeholder: string;
  icon: any;
  name: string;
  type?: string;
  required?: boolean;
  rows?: number;
  delay?: number;
}) => {
  const [focused, setFocused] = useState(false);
  const isTextarea = typeof rows === "number";

  return (
    <motion.div
      className="mb-7"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 + delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <label htmlFor={id} className="mb-2.5 block text-sm font-semibold text-white/92 tracking-tight">
        {label} {required && <span className="text-sky-300">*</span>}
      </label>
      <div className="relative">
        <span
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-250 ${
            isTextarea ? "!top-5 !translate-y-0" : ""
          }`}
          style={{ color: focused ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)" }}
        >
          <Icon size={19} />
        </span>
        {isTextarea ? (
          <textarea
            id={id}
            name={name}
            rows={rows}
            placeholder={placeholder}
            required={required}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full rounded-2xl pl-12 pr-5 py-4 text-[15px] text-white placeholder-white/55 focus:outline-none resize-none leading-relaxed"
            style={buildInputStyle(focused)}
          />
        ) : (
          <input
            id={id}
            type={type}
            placeholder={placeholder}
            name={name}
            required={required}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full rounded-2xl pl-12 pr-5 py-4 text-[15px] text-white placeholder-white/55 focus:outline-none"
            style={buildInputStyle(focused)}
          />
        )}
      </div>
    </motion.div>
  );
};

const ContactSupport = () => {
  const [toast, setToast] = useState<null | { type: "success" | "error"; message: string }>(null);
  const [ctaHover, setCtaHover] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const firstName = ((formData.get("firstName") || "") as string).trim();
    const middleName = ((formData.get("middleName") || "") as string).trim();
    const lastName = ((formData.get("lastName") || "") as string).trim();
    const name = [firstName, middleName, lastName].filter(Boolean).join(" ");

    const payload = {
      firstName,
      middleName,
      lastName,
      name,
      title: formData.get("title"),
      email: formData.get("email"),
      schoolName: formData.get("schoolName"),
      schoolDistrict: formData.get("schoolDistrict"),
      contactNo: formData.get("support"),
      message: formData.get("message"),
      formType: "support",
    };

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      setToast({ type: "success", message: "Message sent successfully. We'll be in touch shortly." });
      form.reset();
      setTimeout(() => setToast(null), 5000);
    } catch {
      setToast({ type: "error", message: "Something went wrong. Please try again." });
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <section id="support" className="relative overflow-hidden pt-[120px] pb-16 md:pb-20 lg:pb-28">
      <div className="absolute top-16 -left-32 w-[450px] h-[450px] rounded-full bg-accent/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-16 -right-32 w-[550px] h-[550px] rounded-full bg-primary-light/15 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-secondary/5 blur-[180px] pointer-events-none" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative"
          >
            <div
              className="relative rounded-[28px] border border-white/10 shadow-2xl overflow-hidden"
              style={{
                background: `
                  radial-gradient(120% 80% at 50% -10%, rgba(14,165,233,0.2) 0%, transparent 55%),
                  linear-gradient(180deg, rgba(15,122,163,0.65) 0%, rgba(10,104,140,0.55) 45%, rgba(8,88,117,0.5) 100%)
                `,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 28%, transparent 55%)',
              }} />
              <div className="absolute inset-0 pointer-events-none rounded-[28px] p-px" style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 35%, rgba(255,255,255,0.0) 70%)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }} />
              <div className="absolute top-0 left-[12%] right-[12%] h-px pointer-events-none" style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                opacity: 0.9,
              }} />

              <div className="relative z-10 p-6 sm:p-10 md:p-12 lg:p-14">
                <AnimatePresence>
                  {toast && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.97 }}
                      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                      className={`fixed top-6 right-6 z-[100] rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-3 max-w-sm w-[calc(100%-3rem)] sm:w-auto ${
                        toast.type === "success" ? "bg-white text-[#0A688C]" : "bg-gradient-to-br from-red-500 to-red-600 text-white"
                      }`}
                      style={{
                        boxShadow: toast.type === "success"
                          ? `
                            0 1px 0 rgba(255,255,255,0.9) inset,
                            0 18px 45px -15px rgba(0,0,0,0.4)
                          `
                          : `
                            0 1px 0 rgba(255,255,255,0.25) inset,
                            0 18px 45px -15px rgba(220,38,38,0.5)
                          `,
                        border: toast.type === "success"
                          ? '1px solid rgba(255,255,255,0.9)'
                          : '1px solid rgba(255,255,255,0.18)',
                      }}
                    >
                      {toast.type === "success" ? (
                        <FiCheckCircle size={22} className="flex-shrink-0" />
                      ) : (
                        <FiAlertCircle size={22} className="flex-shrink-0" />
                      )}
                      <span className="flex-1 text-sm font-semibold leading-snug">{toast.message}</span>
                      <button
                        type="button"
                        className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105"
                        style={{
                          background: toast.type === "success" ? 'rgba(10,104,140,0.12)' : 'rgba(255,255,255,0.15)',
                        }}
                        onClick={() => setToast(null)}
                        aria-label="Close notification"
                      >
                        <FiX size={14} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  className="mb-10 text-center"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <h2 className="mb-3 text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                    Support
                  </h2>
                  <p className="text-white/85 max-w-2xl mx-auto leading-relaxed text-[15px] font-medium">
                    Need assistance with Erudition Solutions? Our team is here to help. Fill out the form below and we&apos;ll reach out to you promptly.
                  </p>
                </motion.div>

                <form onSubmit={handleSubmit}>
                  <p className="mb-3 text-left text-xs text-white/70">
                    * Required fields
                  </p>
                  <div className="-mx-4 flex flex-wrap">
                    <div className="w-full px-4 md:w-1/3">
                      <InputField
                        delay={0}
                        id="firstName" label="First Name" placeholder="Enter your first name"
                        icon={FiUser} name="firstName" required
                      />
                    </div>
                    <div className="w-full px-4 md:w-1/3">
                      <InputField
                        delay={0.06}
                        id="middleName" label="Middle Name (Optional)" placeholder="Enter your middle name"
                        icon={FiUser} name="middleName"
                      />
                    </div>
                    <div className="w-full px-4 md:w-1/3">
                      <InputField
                        delay={0.12}
                        id="lastName" label="Last Name" placeholder="Enter your last name"
                        icon={FiUser} name="lastName" required
                      />
                    </div>
                    <div className="w-full px-4 md:w-1/2">
                      <InputField
                        delay={0.18}
                        id="title" label="Title" placeholder="Enter your role / title"
                        icon={FiBriefcase} name="title" required
                      />
                    </div>
                    <div className="w-full px-4 md:w-1/2">
                      <InputField
                        delay={0.24}
                        id="support" label="Contact No. (Optional)" placeholder="Enter your contact number"
                        icon={FiPhone} name="support"
                      />
                    </div>
                    <div className="w-full px-4 md:w-1/2">
                      <InputField
                        delay={0.30}
                        id="email" label="Email" placeholder="Enter your email address"
                        icon={FiMail} name="email" type="email" required
                      />
                    </div>
                    <div className="hidden md:block md:w-1/2 px-4" aria-hidden="true" />
                    <div className="w-full px-4 md:w-1/2">
                      <InputField
                        delay={0.36}
                        id="schoolName" label="School Name" placeholder="Enter your school name"
                        icon={FiHome} name="schoolName" required
                      />
                    </div>
                    <div className="w-full px-4 md:w-1/2">
                      <InputField
                        delay={0.42}
                        id="schoolDistrict" label="School District" placeholder="Enter your school district"
                        icon={FiHome} name="schoolDistrict" required
                      />
                    </div>
                    <div className="w-full px-4">
                      <InputField
                        delay={0.48}
                        id="message" label="Message" placeholder="Tell us how we can help you..."
                        icon={FiMessageSquare} name="message" required rows={5}
                      />
                    </div>
                    <div className="w-full px-4 mt-2">
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
                        className="flex justify-center"
                      >
                        <button
                          type="submit"
                          className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-[#0A688C] font-bold text-base bg-white hover:bg-white/95 overflow-hidden"
                          style={{
                            transition: 'all 0.25s cubic-bezier(.2,.8,.2,1)',
                            transform: ctaHover ? 'translateY(-2px)' : 'translateY(0)',
                            boxShadow: ctaHover
                              ? `
                                0 1px 0 rgba(255,255,255,0.95) inset,
                                0 -1px 0 rgba(0,0,0,0.04) inset,
                                0 12px 32px -8px rgba(0,0,0,0.35)
                              `
                              : `
                                0 1px 0 rgba(255,255,255,0.85) inset,
                                0 -1px 0 rgba(0,0,0,0.04) inset,
                                0 6px 20px -5px rgba(0,0,0,0.28)
                              `,
                          }}
                          onMouseEnter={() => setCtaHover(true)}
                          onMouseLeave={() => setCtaHover(false)}
                          onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'translateY(-0.5px) scale(0.99)';
                          }}
                          onMouseUp={() => {
                            setCtaHover(true);
                          }}
                        >
                          <FiSend size={18} style={{
                            transition: 'transform 0.3s ease',
                            transform: ctaHover ? 'translate(2px, -1px)' : 'translate(0,0)',
                          }} />
                          <span className="relative z-10 tracking-tight">Send Message</span>
                          <span
                            className="absolute inset-0 rounded-2xl pointer-events-none"
                            style={{
                              background: 'linear-gradient(90deg, transparent, rgba(10,104,140,0.06), transparent)',
                              transform: ctaHover ? 'translateX(100%)' : 'translateX(-100%)',
                              transition: 'transform 0.65s cubic-bezier(.2,.8,.2,1)',
                            }}
                          />
                        </button>
                      </motion.div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSupport;
