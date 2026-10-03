// Regression test for the "Article not found" / render-crash bug on blog detail pages
// that had a non-empty FAQ list (see HISTORY.md / next-agent-blog-404-fix.md).
//
// Root cause: AccordionContent (src/components/ui/accordion.tsx) always wraps its
// `children` in its own inner <div>, and also spreads `...props` onto the underlying
// Radix element. Passing `dangerouslySetInnerHTML` directly as a prop on
// <AccordionContent> therefore puts both `children` and `dangerouslySetInnerHTML` on
// the same React element, which React refuses to render. This only surfaced on blogs
// whose `faqs` array was non-empty, which is why some blogs worked and others didn't.
import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../src/components/ui/accordion";
// Note: sanitizeHtml() (src/lib/sanitize-html.ts) uses the browser's DOMParser and isn't
// callable in this vitest "node" environment. sanitizeHtml's own escaping behavior is not
// what this test is about — the bug is about where dangerouslySetInnerHTML is placed
// relative to AccordionContent's own children, which reproduces with any HTML string.
function renderFaqAccordion(answerHtml: string) {
  return renderToString(
    React.createElement(
      Accordion,
      { type: "single", collapsible: true },
      React.createElement(
        AccordionItem,
        { value: "faq-0" },
        React.createElement(AccordionTrigger, null, "A question?"),
        // This mirrors the current (fixed) markup in src/routes/blogs_.$slug.tsx:
        // the sanitized HTML goes on an inner <div>, not directly on AccordionContent.
        React.createElement(
          AccordionContent,
          { className: "prose prose-sm max-w-none" },
          React.createElement("div", { dangerouslySetInnerHTML: { __html: answerHtml } }),
        ),
      ),
    ),
  );
}

describe("blog FAQ accordion rendering", () => {
  it("renders a FAQ answer containing HTML without throwing", () => {
    expect(() =>
      renderFaqAccordion("<b>Yes.</b> This is a real answer with <i>markup</i>."),
    ).not.toThrow();
  });

  it("would throw if dangerouslySetInnerHTML were placed directly on AccordionContent (the original bug)", () => {
    // This locks in *why* the fix is needed: putting dangerouslySetInnerHTML directly
    // on AccordionContent's own props throws, because AccordionContent always supplies
    // its own `children` (the wrapping <div>) as well.
    const buggyRender = () =>
      renderToString(
        React.createElement(
          Accordion,
          { type: "single", collapsible: true },
          React.createElement(
            AccordionItem,
            { value: "faq-0" },
            React.createElement(AccordionTrigger, null, "A question?"),
            React.createElement(AccordionContent, {
              dangerouslySetInnerHTML: { __html: "<b>bad</b>" },
            }),
          ),
        ),
      );
    expect(buggyRender).toThrow(/dangerouslySetInnerHTML/);
  });
});
