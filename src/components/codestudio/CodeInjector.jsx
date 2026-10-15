import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { hasRuntimeBase44AppId } from "@/lib/base44Binding";

// Injects active CodeBlocks into the DOM based on their scope and the current route.
// CSS → <style> in <head>, JS → <script> in <body>, HTML → rendered div, meta → <head>.
export default function CodeInjector() {
  const location = useLocation();
  const [blocks, setBlocks] = useState([]);
  const [htmlBlocks, setHtmlBlocks] = useState([]);
  const injectedRef = useRef([]);

  useEffect(() => {
    if (!hasRuntimeBase44AppId) return;
    base44.entities.CodeBlock.filter({ active: true }, "-created_date", 200)
      .then(setBlocks)
      .catch(() => {});
  }, []);

  // Inject CSS/JS/meta blocks into the DOM
  useEffect(() => {
    const path = location.pathname;
    const isAdmin = path.startsWith("/admin");
    const matching = blocks.filter((b) => {
      if (b.type === "html") return false;
      if (b.scope === "global") return true;
      if (b.scope === "admin" && isAdmin) return true;
      if (b.scope === "page" && b.page_path === path) return true;
      return false;
    });

    // Remove previously injected elements
    injectedRef.current.forEach((el) => el.remove());
    injectedRef.current = [];

    matching.forEach((block) => {
      try {
        if (block.type === "css") {
          const el = document.createElement("style");
          el.setAttribute("data-codeblock", block.id);
          el.textContent = block.content;
          document.head.appendChild(el);
          injectedRef.current.push(el);
        } else if (block.type === "js") {
          const el = document.createElement("script");
          el.setAttribute("data-codeblock", block.id);
          el.textContent = block.content;
          document.body.appendChild(el);
          injectedRef.current.push(el);
        } else if (block.type === "meta") {
          // Parse meta tags from content (one per line: name=content)
          block.content.split("\n").forEach((line) => {
            const [name, ...rest] = line.split("=");
            if (name && rest.length) {
              const el = document.createElement("meta");
              el.setAttribute("name", name.trim());
              el.setAttribute("content", rest.join("=").trim());
              document.head.appendChild(el);
              injectedRef.current.push(el);
            }
          });
        }
      } catch (e) {
        console.error(`CodeBlock ${block.name} injection failed:`, e);
      }
    });

    return () => {
      injectedRef.current.forEach((el) => el.remove());
      injectedRef.current = [];
    };
  }, [blocks, location.pathname]);

  // Render HTML blocks
  useEffect(() => {
    const path = location.pathname;
    const isAdmin = path.startsWith("/admin");
    setHtmlBlocks(blocks.filter((b) => {
      if (b.type !== "html") return false;
      if (b.scope === "global") return true;
      if (b.scope === "admin" && isAdmin) return true;
      if (b.scope === "page" && b.page_path === path) return true;
      return false;
    }));
  }, [blocks, location.pathname]);

  if (htmlBlocks.length === 0) return null;
  return (
    <div className="code-injector">
      {htmlBlocks.map((b) => (
        <div key={b.id} dangerouslySetInnerHTML={{ __html: b.content }} />
      ))}
    </div>
  );
}