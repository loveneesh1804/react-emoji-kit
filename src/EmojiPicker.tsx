import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IoActivityIcon,
  IoAnimalNatureIcon,
  IoCloseIcon,
  IoFlagIcon,
  IoFoodDrinkIcon,
  IoLabelIcon,
  IoObjectsIcon,
  IoRecentIcon,
  IoSearchIcon,
  IoSmileIcon,
  IoSymbolsIcon,
  IoTravelPlacesIcon,
} from "./Icons";
import { loadEmojiJson } from "./emojis";

interface EmojiPickerProps<T extends HTMLInputElement | HTMLTextAreaElement> {
  inputRef?: React.RefObject<T | null>;
  onEmojiClick?: (emoji: string, code: string) => void;
  label?: React.ReactNode;
  dark?: boolean;
  size?: "Regular" | "Small";
  showOnMobile?: boolean;
}

export interface EmojiType {
  code: string[];
  emoji: string;
  name: string;
  category: string;
  subcategory: string;
}

interface EmojiDataInterface {
  category: string;
  items: {
    baseCode: string;
    variations: EmojiType[];
  }[];
}

interface LocalEmojiInterface {
  code: string;
  emoji: string;
}

const EmojiPicker = <T extends HTMLInputElement | HTMLTextAreaElement>({
  inputRef,
  label,
  dark = false,
  size = "Regular",
  onEmojiClick,
  showOnMobile = false,
}: EmojiPickerProps<T>) => {
  //State
  const [open, setOpen] = useState<boolean>(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [active, setActive] = useState<number>(0);
  const [variantCard, setVariantCard] = useState<string>("");
  const [data, setData] = useState<EmojiDataInterface[]>([]);
  const [activeLineStyle, setActiveLineStyle] = useState({ left: 0 });
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<EmojiType[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [allEmojis, setAllEmojis] = useState<EmojiType[]>([]);
  const [showBtm, setShowBtm] = useState<boolean>(false);
  const [show, setShow] = useState(open);
  const [anim, setAnim] = useState<"open" | "close" | null>(null);
  const [variantPosition, setVariantPosition] = useState<string>("top");
  const [variantTop, setVariantTop] = useState<number>(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [currentSize, setCurrentSize] = useState<"Regular" | "Small">(size);

  //Ref
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mainCardRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScroll = useRef(false);
  const variantRef = useRef<HTMLDivElement | null>(null);

  const programmaticTarget = useRef<number | null>(null);
  const programmaticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  //Variables
  const TOKEN_KEY = "da39a3ee5e6b4b0d3255bfef95601890afd80709";

  const items = localStorage.getItem(TOKEN_KEY);
  const encodedData: LocalEmojiInterface[] = useMemo(
    () => (items ? JSON.parse(items) : []),
    [items]
  );

  const recentData = useMemo(() => decodeEmoji(encodedData), [encodedData]);
  const labelsArr = [
    ...(recentData.length ? [<IoRecentIcon />] : []),
    <IoSmileIcon />,
    <IoAnimalNatureIcon />,
    <IoFoodDrinkIcon />,
    <IoActivityIcon />,
    <IoTravelPlacesIcon />,
    <IoObjectsIcon />,
    <IoSymbolsIcon />,
    <IoFlagIcon />,
  ];

  //Handlers
  const handleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleEmojiClick = (emoji: string, code: string = "") => {
    const el = inputRef?.current;

    const hasValidInput =
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

    const hasEmojiClick = typeof onEmojiClick === "function";

    if (!hasValidInput && !hasEmojiClick) {
      console.warn("EmojiPicker: Provide either inputRef or onEmojiClick.");
      return;
    }

    if (onEmojiClick) {
      onEmojiClick(emoji, code);
    }

    // If inputRef exists → insert into input
    if (inputRef?.current) {
      const el = inputRef.current;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const text = el.value || "";
      el.value = text.slice(0, start) + emoji + text.slice(end);
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    }

    // store in recent history
    const newEmoji = encodeEmoji(emoji);
    const index = encodedData.findIndex((item) => item.code === code);

    if (index === -1) {
      encodedData.push({ emoji: newEmoji, code });
    } else {
      encodedData[index].emoji = newEmoji;
    }
    localStorage.setItem(TOKEN_KEY, JSON.stringify(encodedData));

    setVariantCard("");
  };

  function encodeEmoji(emoji: string) {
    const utf8 = new TextEncoder().encode(emoji); // converts emoji to Uint8Array
    let binary = "";
    utf8.forEach((byte) => (binary += String.fromCharCode(byte)));
    return btoa(binary); // now safe for Safari
  }

  function decodeEmoji(
    encodedArr: LocalEmojiInterface[]
  ): LocalEmojiInterface[] {
    if (!encodedArr.length) return [];

    return encodedArr.map((item) => {
      const binary = atob(item.emoji); // Base64 → binary
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i); // binary → bytes
      }

      const emoji = new TextDecoder().decode(bytes); // UTF-8 → emoji

      return {
        emoji,
        code: item.code,
      };
    });
  }

  function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function searchEmojis(query: string, all: EmojiType[]) {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // Split into tokens: "white hair" → ["white", "hair"]
    const tokens = q.split(/\s+/).map((t) => escapeRegex(t));

    return all
      .map((emoji) => {
        const name = emoji.name.toLowerCase();
        const cat = emoji.category.toLowerCase();
        const sub = (emoji.subcategory ?? "").toLowerCase();
        const em = emoji.emoji;

        let score = 0;
        let matched = true;

        for (const t of tokens) {
          const r = new RegExp(t, "i");

          // ⭐ Priority scoring
          if (name === t || cat === t || sub === t) score += 5; // exact match
          else if (name.startsWith(t)) score += 4; // prefix match
          else if (cat.startsWith(t) || sub.startsWith(t)) score += 3;
          else if (r.test(name) || r.test(cat) || r.test(sub))
            score += 2; // contains
          else if (em.includes(query)) score += 2; // emoji chars
          else {
            matched = false; // token must match something
            break;
          }
        }

        return matched ? { emoji, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .map((result) => result!.emoji);
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearch(query);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const result = searchEmojis(query, allEmojis);
      setSearchResults(result);
    }, 250); // debounce 250ms
  };

  // const handleLabelClick = (index: number) => {

  //   isProgrammaticScroll.current = true;

  //   const section = sectionRefs.current[index];
  //   if (section) {
  //     section.scrollIntoView({
  //       behavior: "smooth",
  //       block: "start",
  //     });
  //   }
  //   setActive(index);
  //   setTimeout(() => {
  //     isProgrammaticScroll.current = false;
  //   }, 1200);
  // };

  //Effect

  const handleLabelClick = (index: number) => {
    const section = sectionRefs.current[index];
    const root = mainCardRef.current;
    const labels = lineRef.current?.querySelectorAll("span");
    const label = labels?.[index] as HTMLElement | undefined;

    if (!section || !root || !label) return;

    // Cancel previous programmatic trackers
    if (programmaticTimer.current) {
      clearTimeout(programmaticTimer.current);
      programmaticTimer.current = null;
    }

    // Mark programmatic scroll in progress
    isProgrammaticScroll.current = true;

    // Compute scroll target relative to container (section.offsetTop is child offset)
    const targetTop = section.offsetTop;

    // Remember target so scroll listener can compare
    programmaticTarget.current = targetTop;

    // Move pointer immediately (so underline feels instant)
    if (label) setActiveLineStyle((_) => ({ left: label.offsetLeft }));

    // start smooth scroll
    root.scrollTo({ top: targetTop, behavior: "smooth" });

    // Start a fallback timer in case scroll events are not fired reliably
    // We will still clear this timer on real scroll-end.
    programmaticTimer.current = setTimeout(() => {
      // If still programmatic, unlock and clear target
      isProgrammaticScroll.current = false;
      programmaticTarget.current = null;
      programmaticTimer.current = null;
      // ensure active state reflects target index
      setActive(index);
    }, 1200); // >= typical smooth scroll durations (safe fallback)
  };

  useEffect(() => {
    const root = mainCardRef.current;
    if (!root) return;

    let debounce: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      // if programmatic target exists, check distance to it
      if (programmaticTarget.current != null) {
        const cur = root.scrollTop;
        const diff = Math.abs(cur - programmaticTarget.current);

        // if we're very close to target, treat as finished
        if (diff <= 2) {
          // clear fallback timer
          if (programmaticTimer.current) {
            clearTimeout(programmaticTimer.current);
            programmaticTimer.current = null;
          }
          // unlock observer
          isProgrammaticScroll.current = false;
          programmaticTarget.current = null;
          // update visible active based on which section is at top
          // (Observer will also handle it eventually; we proactively set)
          // find the section whose offsetTop is nearest to scrollTop:
          let nearestIndex = 0;
          let nearestDist = Infinity;
          sectionRefs.current.forEach((sec, idx) => {
            if (!sec) return;
            const d = Math.abs(sec.offsetTop - cur);
            if (d < nearestDist) {
              nearestDist = d;
              nearestIndex = idx;
            }
          });
          setActive(nearestIndex);
          return;
        }
        // otherwise still scrolling programmatically — keep isProgrammaticScroll true
        return;
      }

      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        debounce = null;
      }, 100);
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root.removeEventListener("scroll", onScroll);
      if (debounce) clearTimeout(debounce);
    };
  }, []);

  useEffect(() => {
    const checkWidth = () => {
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // Mobile device
        if (showOnMobile) {
          setCurrentSize("Small"); // force small
          setIsDisabled(false); // always visible
        } else {
          setCurrentSize(size); // keep original size
          setIsDisabled(true); // hide picker
        }
      } else {
        // Desktop
        setCurrentSize(size); // always original size
        setIsDisabled(false); // always visible
      }
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, [showOnMobile, size]);

  useEffect(() => {
    if (!data.length) return;

    // Flatten only once
    const flat = data.flatMap((section) =>
      section.items.flatMap((item) => item.variations)
    );

    setAllEmojis(flat);
  }, [data]);

  useEffect(() => {
    const grouped = loadEmojiJson().emojis.reduce((acc, emoji) => {
      const category = emoji.category;
      const baseCode = emoji.code?.[0];

      if (!acc[category]) {
        acc[category] = {};
      }

      if (!acc[category][baseCode]) {
        acc[category][baseCode] = {
          baseCode,
          variations: [],
        };
      }

      acc[category][baseCode].variations.push(emoji);

      return acc;
    }, {} as Record<string, Record<string, { baseCode: string; variations: EmojiType[] }>>);

    const ORDER = [
      "Smileys & Peoples",
      "Animals & Nature",
      "Food & Drink",
      "Activities",
      "Travel & Places",
      "Objects",
      "Symbols",
      "Flags",
    ];

    const sections = ORDER.filter((cat) => grouped[cat]) // include only existing categories
      .map((category) => ({
        category,
        items: Object.values(grouped[category]),
      }));

    setData(sections);
  }, []);

  // Calculate safe, visible position dynamically

  useEffect(() => {
    if (!open || !labelRef.current) return;

    const rect = labelRef.current.getBoundingClientRect();
    const parent = labelRef.current.offsetParent as HTMLElement | null;

    // If no offset parent, fallback to <body>
    const parentRect = parent
      ? parent.getBoundingClientRect()
      : { left: 0, top: 0 };

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const containerPxHeight = currentSize === "Regular" ? 415 : 310;
    const CONTAINER_WIDTH = currentSize === "Regular" ? 550 : 350;

    // --- Convert rect → coordinates relative to offset parent ---
    const relLeft = rect.left - parentRect.left;
    const relTop = rect.top - parentRect.top;

    // Default (open below)
    let left = relLeft + rect.width / 2 - CONTAINER_WIDTH / 2;
    let top = relTop + rect.height + 8;

    // Space checks
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (
      spaceBelow < containerPxHeight + 10 &&
      spaceAbove > containerPxHeight + 10
    ) {
      top = relTop - containerPxHeight - 8;
    }

    // ---- Clamp to viewport (always visible) ----
    const absToViewportLeft = (parentRect.left || 0) + left;
    const absToViewportTop = (parentRect.top || 0) + top;

    // Horizontal clamp
    if (absToViewportLeft < 8) {
      left += 8 - absToViewportLeft;
    }
    if (absToViewportLeft + CONTAINER_WIDTH > viewportWidth - 8) {
      left -= absToViewportLeft + CONTAINER_WIDTH - (viewportWidth - 8);
    }

    // Vertical clamp
    if (absToViewportTop < 8) {
      top += 8 - absToViewportTop;
    }
    if (absToViewportTop + containerPxHeight > viewportHeight - 8) {
      top -= absToViewportTop + containerPxHeight - (viewportHeight - 8);
    }

    // Dynamic transform origin
    const xCenter = rect.left + rect.width / 2;
    const yCenter = rect.top + rect.height / 2;

    const xOrigin =
      xCenter < viewportWidth * 0.33
        ? "left"
        : xCenter > viewportWidth * 0.66
        ? "right"
        : "center";

    const yOrigin =
      yCenter < viewportHeight * 0.33
        ? "top"
        : yCenter > viewportHeight * 0.66
        ? "bottom"
        : "center";

    setStyle({
      position: "absolute",
      width: `${CONTAINER_WIDTH}px`,
      height: `${containerPxHeight}px`,
      left: `${left}px`,
      top: `${top}px`,
      transformOrigin: `${xOrigin} ${yOrigin}`,
      boxShadow: "0 2px 5px rgba(11,20,26,.26), 0 2px 10px rgba(11,20,26,.16)",
      background: "#fff",
      borderRadius: "10px",
      zIndex: 9999,
    });
  }, [open, show, currentSize]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedInsideContainer =
        containerRef.current?.contains(target) ?? false;

      const clickedInsideLabel = labelRef.current?.contains(target) ?? false;

      const clickedInsideInput = inputRef?.current?.contains?.(target) ?? false;

      if (
        !clickedInsideContainer &&
        !clickedInsideLabel &&
        !clickedInsideInput
      ) {
        setSearch("");
        setOpen(false);
        setVariantCard("");

        setTimeout(() => {
          setActive(0);
          setShowBtm(false);
        }, 150);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, inputRef]);

  useEffect(() => {
    const handleVariantOutsideClick = (event: MouseEvent) => {
      if (
        variantRef.current &&
        !variantRef.current.contains(event.target as Node)
      ) {
        setVariantCard("");
      }
    };
    if (open) document.addEventListener("mousedown", handleVariantOutsideClick);
    return () =>
      document.removeEventListener("mousedown", handleVariantOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!lineRef.current) return;

    const labels = lineRef.current.querySelectorAll("span");
    const activeLabel = labels[active] as HTMLElement | undefined;

    if (activeLabel) {
      const { offsetLeft } = activeLabel;

      setActiveLineStyle((prev) => {
        if (prev.left === offsetLeft) return prev;
        return { left: offsetLeft };
      });
    }
  }, [active]);

  useEffect(() => {
    if (!mainCardRef.current) return;
    if (!sectionRefs.current.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!isProgrammaticScroll.current && entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            setActive(index);
          }
        });
      },
      {
        root: mainCardRef.current,
        threshold: 0,
        rootMargin: "0px 0px -99% 0px",
      }
    );

    sectionRefs.current.forEach((sec) => sec && observer.observe(sec));

    return () => observer.disconnect();
  }, [data, recentData.length, show]);

  useEffect(() => {
    const root = mainCardRef.current;
    if (!root) return;

    const handleScroll = () => {
      if (root.scrollTop > 100) {
        setShowBtm(true);
      } else {
        setShowBtm(false);
      }
    };

    root.addEventListener("scroll", handleScroll);

    return () => {
      root.removeEventListener("scroll", handleScroll);
    };
  }, [show]);

  useEffect(() => {
    if (open) {
      // Show immediately
      setShow(true);

      // Play opening animation
      requestAnimationFrame(() => setAnim("open"));
    } else {
      // Play closing animation
      setAnim("close");
      // Remove from DOM after animation ends
      setTimeout(() => {
        setShow(false);
      }, 150); // match animation duration
    }
  }, [open]);

  useEffect(() => {
    if (!variantCard || !variantRef.current || !mainCardRef.current) return;

    const popup = variantRef.current;
    const main = mainCardRef.current;

    // 🌟 read ANCHOR BUTTON rect instead of popup rect
    const anchor = popup.parentElement!.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();

    const popupHeight = popup.getBoundingClientRect().height; // height OK to read

    // Space above the emoji button inside main card
    const spaceAbove = anchor.top - mainRect.top;

    // 🌟 Decide ONCE
    if (spaceAbove >= popupHeight + 6) {
      setVariantTop(-(popupHeight + 10));
      setVariantPosition("top");
    } else {
      setVariantTop(40);
      setVariantPosition("bottom");
    }

    // horizontal overflow fix only
    const popupRect = popup.getBoundingClientRect();
    let newLeft = popup.offsetLeft;

    if (popupRect.left < mainRect.left) {
      newLeft += mainRect.left - popupRect.left + 6;
    }
    if (popupRect.right > mainRect.right) {
      newLeft -= popupRect.right - mainRect.right + 6;
    }

    popup.style.left = `${newLeft}px`;
  }, [variantCard]);

  if (isDisabled && !showOnMobile) return null;

  return (
    <div className="react-emoji-kit-main">
      <span
        ref={labelRef}
        onClick={handleOpen}
        role="button"
        title="Emojis"
        className={`react-emoji-label ${dark && "dark"}`}
      >
        {label || <IoLabelIcon />}
      </span>

      {show ? (
        <>
          <div
            className={`react-emoji-container 
          ${dark && "dark"}
          ${anim === "open" ? "popup-open" : ""}
          ${anim === "close" ? "popup-close" : ""}
        `}
            ref={containerRef}
            style={{ ...style }}
          >
            <div
              className={`react-emoji-container-header
              ${dark && "dark"}
               ${showBtm ? "border-btm" : ""}`}
            >
              <div
                className={`react-emoji-type-labels ${
                  currentSize === "Small" && "small"
                } ${dark && "dark"}`}
                ref={lineRef}
              >
                {labelsArr.map((el, i) => (
                  <span
                    style={{ width: ` calc(100% / ${labelsArr.length})` }}
                    className={
                      active === i ? `react-active-label ${dark && "dark"}` : ""
                    }
                    onClick={() => handleLabelClick(i)}
                    key={i}
                  >
                    {el}
                  </span>
                ))}
                <div
                  style={{
                    backgroundColor: !showBtm
                      ? "transparent"
                      : dark
                      ? "#282828"
                      : "rgb(246, 246, 246)",
                  }}
                  className="react-emoji-active-line"
                >
                  <span
                    style={{
                      left: activeLineStyle.left,
                      width: search.length
                        ? "0px"
                        : `calc((100% / ${labelsArr.length}) - ${
                            currentSize === "Small" ? "5" : "20"
                          }px)`,
                      background: dark ? "#fafafa" : "black",
                    }}
                  ></span>
                </div>
              </div>
              <div className={`react-emoji-search-bar ${dark && "dark"}`}>
                <IoSearchIcon />
                <input
                  value={search}
                  onChange={handleSearch}
                  type="text"
                  placeholder="Search emoji"
                />
                {search.length ? (
                  <span
                    className={`close-search-result ${dark ? "dark" : "light"}`}
                    onClick={() => setSearch("")}
                  >
                    <IoCloseIcon />
                  </span>
                ) : undefined}
              </div>
            </div>
            <div
              ref={mainCardRef}
              className={`react-emoji-main-card ${
                currentSize === "Small" && "small"
              } ${dark && "dark"}`}
            >
              {search.length ? (
                <div
                  className={`react-emoji-main-grid ${
                    currentSize === "Small" && "small"
                  }`}
                >
                  {searchResults.map((el, i) => (
                    <span
                      key={i}
                      onClick={() => handleEmojiClick(el.emoji, el.code[0])}
                    >
                      {el.emoji}
                    </span>
                  ))}
                </div>
              ) : (
                <>
                  {recentData.length ? (
                    <div
                      ref={(el) => {
                        if (el) sectionRefs.current[0] = el;
                      }}
                      data-index={0}
                      className={`react-emoji-sub-sections ${dark && dark}`}
                    >
                      <p>Recent</p>
                      <div
                        className={`react-emoji-main-grid ${
                          currentSize === "Small" && "small"
                        }`}
                      >
                        {recentData.map((el, i) => (
                          <span
                            onClick={() => handleEmojiClick(el.emoji, el.code)}
                            key={i}
                            className="react-emoji-symbol"
                          >
                            {el.emoji}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : undefined}
                  {data.length
                    ? data.map((el, i) => {
                        const finalIndex = recentData.length ? i + 1 : i;
                        return (
                          <div
                            ref={(ref) => {
                              if (ref) sectionRefs.current[finalIndex] = ref;
                            }}
                            data-index={finalIndex}
                            key={i}
                            className="react-emoji-sub-sections"
                          >
                            <p>{el.category}</p>
                            <div
                              className={`react-emoji-main-grid ${
                                currentSize === "Small" && "small"
                              }`}
                            >
                              {el.items.map((emoji, idx) =>
                                emoji.variations.length > 1 ? (
                                  <span
                                    onClick={() =>
                                      setVariantCard(`${idx}${el.category}`)
                                    }
                                    key={idx}
                                    className="react-emoji-variants-card"
                                  >
                                    {(() => {
                                      const recent = recentData.find(
                                        (el) => el.code === emoji.baseCode
                                      );
                                      return recent
                                        ? recent.emoji
                                        : emoji.variations[0].emoji;
                                    })()}
                                    {variantCard === `${idx}${el.category}` ? (
                                      <>
                                        <div
                                          className={`emoji-variant-pointer ${
                                            dark && "dark"
                                          } ${variantPosition}`}
                                        ></div>
                                        <div
                                          ref={variantRef}
                                          className={`emoji-variant-container 
                                          ${dark && "dark"}
                                          ${
                                            emoji.variations.length > 7
                                              ? "grid"
                                              : "flex"
                                          }`}
                                          style={{
                                            top: `${variantTop}px`,
                                          }}
                                        >
                                          {emoji.variations.map(
                                            (variant, index) => (
                                              <span
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleEmojiClick(
                                                    variant.emoji,
                                                    variant.code[0]
                                                  );
                                                }}
                                                key={index}
                                                style={{
                                                  animationDelay: `${
                                                    index * 40
                                                  }ms`,
                                                }}
                                              >
                                                {variant.emoji}
                                              </span>
                                            )
                                          )}
                                        </div>
                                      </>
                                    ) : undefined}
                                  </span>
                                ) : (
                                  <span
                                    key={idx}
                                    className="react-emoji-symbol"
                                    onClick={() =>
                                      handleEmojiClick(
                                        emoji.variations[0].emoji,
                                        emoji.baseCode
                                      )
                                    }
                                  >
                                    {emoji.variations[0].emoji}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })
                    : undefined}
                </>
              )}
            </div>
            {currentSize === "Regular" ? (
              <div className={`react-emoji-footer ${dark && "dark"}`}>
                <span>
                  <IoSmileIcon />
                </span>
              </div>
            ) : undefined}
          </div>
        </>
      ) : undefined}
    </div>
  );
};

export default EmojiPicker;
