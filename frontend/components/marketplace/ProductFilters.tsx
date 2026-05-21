"use client";

import { useState } from "react";

const SIZES_CLOTHING = ["XS", "S", "M", "L", "XL", "XXL"];
const SIZES_SHOES = ["36", "37", "38", "39", "40", "41", "42"];

interface Props {
  selectedSizes: string[];
  onSizeChange: (size: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onClear: () => void;
}

function SizeBtn({
  size,
  selected,
  onClick,
}: {
  size: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        minWidth: 36,
        padding: "5px 8px",
        fontSize: 11,
        cursor: "pointer",
        border: `1px solid ${selected ? "#111" : hov ? "#888" : "#ddddd9"}`,
        backgroundColor: selected ? "#111" : "transparent",
        color: selected ? "#fff" : "#555",
        transition: "all 0.15s",
      }}
    >
      {size}
    </button>
  );
}

export function ProductFilters({
  selectedSizes,
  onSizeChange,
  priceRange,
  onPriceRangeChange,
  onClear,
}: Props) {
  const hasActive =
    selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 500;

  const label: React.CSSProperties = {
    margin: "0 0 12px",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.2em",
    color: "#1a1a1a",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Talla */}
      <div>
        <p style={label}>Talla</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {SIZES_CLOTHING.map((s) => (
              <SizeBtn
                key={s}
                size={s}
                selected={selectedSizes.includes(s)}
                onClick={() => onSizeChange(s)}
              />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {SIZES_SHOES.map((s) => (
              <SizeBtn
                key={s}
                size={s}
                selected={selectedSizes.includes(s)}
                onClick={() => onSizeChange(s)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Precio */}
      <div>
        <p style={label}>Precio</p>
        <input
          type="range"
          min={0}
          max={500}
          step={10}
          value={priceRange[1]}
          onChange={(e) =>
            onPriceRangeChange([priceRange[0], Number(e.target.value)])
          }
          style={{ width: "100%", accentColor: "#111", marginBottom: 8 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "#777",
          }}
        >
          <span>${priceRange[0]}</span>
          <span>${priceRange[1] >= 500 ? "500+" : priceRange[1]}</span>
        </div>
      </div>

      {/* Clear */}
      {hasActive && (
        <button
          onClick={onClear}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#9b9b97",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            textAlign: "left",
          }}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
