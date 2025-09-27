"use client"
import React from "react";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { useTranslation } from "@/hooks/useTranslation";

export default function WhatsAppChatButton() {
  const { t } = useTranslation();

  const phoneNumber = "5050782635"; // your business WhatsApp number
  const message = t("whatsapp.defaultMessage", "Hey! I have a question, can you help me?");

  return (
    <>
      {/* Tooltip target is the button via id */}
      <Tooltip target=".whatsapp-btn" />

      <a
        href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 1000 }}
      >
        <Button
          id="whatsapp-btn"
          icon="pi pi-whatsapp"
          className="p-button-rounded p-button-success p-button-lg shadow-3 whatsapp-btn"
          aria-label={t("whatsapp.ariaLabel", "Chat on WhatsApp")}
          tooltip={t("whatsapp.tooltip", "💬 Ask us anything — we’re eager to help!")}
          tooltipOptions={{ position: "left" }}
        />
      </a>
    </>
  );
}
