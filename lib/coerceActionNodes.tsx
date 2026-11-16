import {
  Fragment,
  isValidElement,
  type ReactNode,
} from "react";

/** LLM が actions に渡しがちな `{ label, href }` */
export type ActionLinkDescriptor = {
  label: string;
  href?: string;
  variant?: "primary" | "secondary" | string;
};

export function isActionLinkDescriptor(
  value: unknown,
): value is ActionLinkDescriptor {
  if (value == null || typeof value !== "object") return false;
  if (isValidElement(value)) return false;
  const rec = value as Record<string, unknown>;
  return typeof rec.label === "string" && rec.label.trim().length > 0;
}

/**
 * テキスト枠向け。`{label,href}` → label 文字列。正規 ReactNode はそのまま。
 * Button / 見出しなど「子にオブジェクトを置けない」場所用。
 */
export function coerceDisplayText(value: ReactNode): ReactNode {
  if (value == null || typeof value === "boolean") return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (isValidElement(value)) return value;
  if (isActionLinkDescriptor(value)) return value.label;
  if (Array.isArray(value)) {
    const parts = value
      .map((item, index) => {
        const text = coerceDisplayText(item as ReactNode);
        if (text == null || text === false) return null;
        return <Fragment key={index}>{text}</Fragment>;
      })
      .filter(Boolean);
    return parts.length > 0 ? parts : null;
  }
  return null;
}

function actionLinkClassName(variant: string | undefined, index: number): string {
  const kind =
    variant === "secondary" || variant === "outline" || index > 0
      ? "secondary"
      : "primary";
  if (kind === "secondary") {
    return "inline-flex h-10 items-center justify-center rounded-md border border-current/30 bg-transparent px-4 text-sm font-medium transition hover:bg-current/10";
  }
  return "inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90";
}

/**
 * `actions={{label,href}}` / `actions={[{label,href}]}` をレンダー可能なノードに変換。
 * 正規の ReactNode（Button / <a>）はそのまま通す。
 */
export function coerceActionNodes(actions: ReactNode): ReactNode {
  if (actions == null || typeof actions === "boolean") return null;

  if (
    isValidElement(actions) ||
    typeof actions === "string" ||
    typeof actions === "number"
  ) {
    return actions;
  }

  if (Array.isArray(actions)) {
    const nodes = actions
      .map((item, index) => {
        if (isActionLinkDescriptor(item)) {
          return (
            <a
              key={`${item.label}-${index}`}
              href={typeof item.href === "string" ? item.href : "#"}
              className={actionLinkClassName(item.variant, index)}
            >
              {item.label}
            </a>
          );
        }
        if (isValidElement(item)) {
          return <Fragment key={index}>{item}</Fragment>;
        }
        return null;
      })
      .filter(Boolean);
    return nodes.length > 0 ? nodes : null;
  }

  if (isActionLinkDescriptor(actions)) {
    return (
      <a
        href={typeof actions.href === "string" ? actions.href : "#"}
        className={actionLinkClassName(actions.variant, 0)}
      >
        {actions.label}
      </a>
    );
  }

  // 未知の plain object は React #31 の原因になるので描画しない
  return null;
}
