import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  /** Width of the simulated screen in CSS pixels. */
  width: number;
  /** Height of the simulated screen before scaling. */
  height?: number;
  children: React.ReactNode;
  className?: string;
};

/**
 * Renders the website preview inside a real iframe so that responsive rules
 * (mobile / tablet / desktop) react to the simulated screen width instead of
 * the browser window. The frame is scaled down to fit whatever space it has.
 */
export function PreviewFrame({ width, height = 900, children, className }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);

  // Fit the simulated screen into the available column width.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const measure = () => {
      const available = wrapper.clientWidth;
      setScale(available > 0 ? Math.min(1, available / width) : 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [width]);

  // Copy the app's stylesheets into the frame, then render the preview into it.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const attach = () => {
      const doc = frame.contentDocument;
      if (!doc) return;
      doc.open();
      doc.write("<!doctype html><html><head></head><body></body></html>");
      doc.close();
      for (const node of Array.from(document.head.querySelectorAll('style,link[rel="stylesheet"]'))) {
        doc.head.appendChild(node.cloneNode(true));
      }
      const reset = doc.createElement("style");
      reset.textContent = "html,body{margin:0;padding:0;background:#fff;}";
      doc.head.appendChild(reset);
      setBody(doc.body);
    };

    attach();
    frame.addEventListener("load", attach);
    return () => frame.removeEventListener("load", attach);
  }, []);

  return (
    <div ref={wrapperRef} className={className}>
      <div style={{ height: height * scale, overflow: "hidden" }}>
        <iframe
          ref={frameRef}
          title="Website preview"
          className="rounded-md border-0 bg-white shadow-sm"
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
      {body ? createPortal(children, body) : null}
    </div>
  );
}
