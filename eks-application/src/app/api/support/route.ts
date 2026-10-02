import { NextRequest, NextResponse } from "next/server";

const SUPPORT_EMAIL = "support@mathmatterstx.com";

async function sendEmail(payload: Record<string, string>) {
  const res = await fetch(`https://formsubmit.co/ajax/${SUPPORT_EMAIL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      ...payload,
      _subject: payload._subject || "New Support Submission - Erudition Solution",
      _template: "table",
      _captcha: "false",
    }),
  });

  if (!res.ok) {
    throw new Error("Email delivery failed");
  }
}

async function sendSms(message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const recipients = process.env.SMS_RECIPIENT_PHONES;

  if (!accountSid || !authToken || !fromNumber || !recipients) {
    return;
  }

  const phones = recipients
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean);

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  await Promise.all(
    phones.map((to) =>
      fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: fromNumber, Body: message }).toString(),
      }),
    ),
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      firstName,
      middleName,
      lastName,
      title,
      email,
      schoolName,
      schoolDistrict,
      contactNo,
      message,
      productsOfInterest,
      formType = "support",
    } = body;

    const isSupportForm = formType === "support";
    const isContactForm = formType === "contact";

    const resolvedName =
      name ||
      [firstName, middleName, lastName]
        .map((part) => (typeof part === "string" ? part.trim() : ""))
        .filter(Boolean)
        .join(" ");

    const selectedProducts = Array.isArray(productsOfInterest)
      ? productsOfInterest.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : typeof productsOfInterest === "string" && productsOfInterest.trim()
        ? [productsOfInterest.trim()]
        : [];

    if (isContactForm || isSupportForm) {
      if (!firstName?.trim() || !lastName?.trim() || !email || !message) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
    } else if (!resolvedName || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (isContactForm && selectedProducts.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (isSupportForm && (!title || !schoolName || !schoolDistrict)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subject = isContactForm
      ? "New Contact Us Submission - Erudition Solution"
      : "New Support Submission - Erudition Solution";

    const emailPayload: Record<string, string> = {
      name: resolvedName,
      email,
      contactNo: contactNo || "N/A",
      message,
      _subject: subject,
    };

    if (isContactForm || isSupportForm) {
      emailPayload.firstName = firstName.trim();
      if (middleName?.trim()) emailPayload.middleName = middleName.trim();
      emailPayload.lastName = lastName.trim();
    }
    if (isContactForm) {
      emailPayload.productsOfInterest = selectedProducts.join(", ");
    }
    if (title) emailPayload.title = title;
    if (schoolName) emailPayload.schoolName = schoolName;
    if (schoolDistrict) emailPayload.schoolDistrict = schoolDistrict;

    await sendEmail(emailPayload);

    const smsBody = [
      `New ${isContactForm ? "Contact Us" : "Support"} submission`,
      `Name: ${resolvedName}`,
      title ? `Title: ${title}` : null,
      `Email: ${email}`,
      schoolName ? `School: ${schoolName}` : null,
      schoolDistrict ? `District: ${schoolDistrict}` : null,
      contactNo ? `Phone: ${contactNo}` : null,
      isContactForm ? `Products: ${selectedProducts.join(", ")}` : null,
      `Message: ${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendSms(smsBody);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
