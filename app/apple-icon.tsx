import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 14,
          background: "#9dff3c",
          paddingBottom: 54,
        }}
      >
        <div style={{ width: 22, height: 40, background: "#0c0d0a", borderRadius: 7 }} />
        <div style={{ width: 22, height: 66, background: "#0c0d0a", borderRadius: 7 }} />
        <div style={{ width: 22, height: 92, background: "#0c0d0a", borderRadius: 7 }} />
      </div>
    ),
    { ...size },
  );
}
