"use client";

import { useState } from "react";
import { formatCLP } from "@/lib/utils/format";

const MAX_PRICE = 120000;
const SIZES_CLOTHING = ["XS", "S", "M", "L", "XL", "XXL"];
const SIZES_SHOES = ["36", "37", "38", "39", "40", "41", "42"];

const COLORS = [
  { label: "Negro",    value: "negro",    hex: "#1a1a1a" },
  { label: "Blanco",   value: "blanco",   hex: "#f0f0f0" },
  { label: "Azul",     value: "azul",     hex: "#2563eb" },
  { label: "Rojo",     value: "rojo",     hex: "#dc2626" },
  { label: "Verde",    value: "verde",    hex: "#16a34a" },
  { label: "Amarillo", value: "amarillo", hex: "#eab308" },
  { label: "Rosado",   value: "rosado",   hex: "#f472b6" },
  { label: "Gris",     value: "gris",     hex: "#9ca3af" },
  { label: "Café",     value: "cafe",     hex: "#92400e" },
  { label: "Beige",    value: "beige",    hex: "#d4b896" },
];

const OCCASIONS = [
  { value: "Casual",  label: "Casual",  isNew: true },
  { value: "Oficina", label: "Oficina", isNew: false },
  { value: "Fiesta",  label: "Fiesta",  isNew: false },
  { value: "Deporte", label: "Deporte", isNew: false },
];

const PRICE_PRESETS: { label: string; range: [number, number] }[] = [
  { label: "Hasta $20.000",        range: [0, 20000] },
  { label: "$20.000 – $50.000",    range: [20000, 50000] },
  { label: "$50.000 – $100.000",   range: [50000, 100000] },
  { label: "Más de $100.000",      range: [100000, MAX_PRICE] },
];

export interface BrandOption {
  id: string;
  name: string;
  count: number;
}

interface Props {
  selectedSizes: string[];
  onSizeChange: (size: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onClear: () => void;
  brandOptions?: BrandOption[];
  selectedBrands?: string[];
  onBrandChange?: (id: string) => void;
  selectedColors?: string[];
  onColorChange?: (color: string) => void;
  selectedOccasions?: string[];
  onOccasionChange?: (occ: string) => void;
}

const label: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: "#1a1a1a",
};

const divider: React.CSSProperties = {
  borderTop: "1px solid #f0f0f0",
  paddingTop: 24,
};

function SizeBtn({ size, selected, onClick }: { size: string; selected: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        minWidth: 36, padding: "5px 8px", fontSize: 11, cursor: "pointer",
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
  selectedSizes, onSizeChange, priceRange, onPriceRangeChange, onClear,
  brandOptions = [], selectedBrands = [], onBrandChange,
  selectedColors = [], onColorChange,
  selectedOccasions = [], onOccasionChange,
}: Props) {
  const [brandSearch, setBrandSearch] = useState("");

  const hasActive =
    selectedSizes.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < MAX_PRICE ||
    selectedBrands.length > 0 ||
    selectedColors.length > 0 ||
    selectedOccasions.length > 0;

  const filteredBrands = brandOptions.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const activePreset = PRICE_PRESETS.find(
    (p) => p.range[0] === priceRange[0] && p.range[1] === priceRange[1]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── MARCAS ── */}
      {brandOptions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={label}>Marcas</p>
          {brandOptions.length > 4 && (
            <input
              type="text"
              placeholder="Buscar marca..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              style={{
                width: "100%", padding: "7px 10px", fontSize: 11,
                border: "1px solid #e0e0e0", outline: "none",
                marginBottom: 10, boxSizing: "border-box", fontFamily: "inherit",
                color: "#333",
              }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredBrands.map((b) => {
              const checked = selectedBrands.includes(b.id);
              return (
                <label key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onBrandChange?.(b.id)}
                    style={{ accentColor: "#111", width: 13, height: 13, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 12, color: "#444", flex: 1 }}>{b.name}</span>
                  <span style={{ fontSize: 10, color: "#aaa" }}>{b.count}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PRECIO ── */}
      <div style={brandOptions.length > 0 ? divider : { marginBottom: 24 }}>
        <p style={{ ...label, marginTop: brandOptions.length > 0 ? 0 : undefined }}>Precio</p>
        <input
          type="range" min={0} max={MAX_PRICE} step={5000} value={priceRange[1]}
          onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
          style={{ width: "100%", accentColor: "#111", marginBottom: 8 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#777", marginBottom: 12 }}>
          <span>{formatCLP(priceRange[0])}</span>
          <span>{priceRange[1] >= MAX_PRICE ? `${formatCLP(MAX_PRICE)}+` : formatCLP(priceRange[1])}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {PRICE_PRESETS.map((preset) => {
            const active = activePreset?.label === preset.label;
            return (
              <button
                key={preset.label}
                onClick={() => onPriceRangeChange(active ? [0, MAX_PRICE] : preset.range)}
                style={{
                  textAlign: "left", padding: "5px 8px", fontSize: 11,
                  background: active ? "#f5f5f5" : "none",
                  border: active ? "1px solid #e0e0e0" : "1px solid transparent",
                  color: active ? "#111" : "#777",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TALLAS ── */}
      <div style={{ ...divider, marginTop: 24 }}>
        <p style={label}>Talla</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {SIZES_CLOTHING.map((s) => (
              <SizeBtn key={s} size={s} selected={selectedSizes.includes(s)} onClick={() => onSizeChange(s)} />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {SIZES_SHOES.map((s) => (
              <SizeBtn key={s} size={s} selected={selectedSizes.includes(s)} onClick={() => onSizeChange(s)} />
            ))}
          </div>
        </div>
      </div>

      {/* ── COLORES ── */}
      <div style={{ ...divider, marginTop: 24 }}>
        <p style={label}>Color</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {COLORS.map(({ label: lbl, value, hex }) => {
            const active = selectedColors.includes(value);
            return (
              <button
                key={value}
                title={lbl}
                onClick={() => onColorChange?.(value)}
                style={{
                  width: 28, height: 28, borderRadius: "50%", backgroundColor: hex,
                  cursor: "pointer", border: active ? "3px solid #111" : "2px solid #e0e0e0",
                  outline: active ? "2px solid #fff" : "none",
                  outlineOffset: -4, boxSizing: "border-box",
                  transition: "border 0.15s",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ── OCASIÓN ── */}
      <div style={{ ...divider, marginTop: 24 }}>
        <p style={label}>Ocasión</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {OCCASIONS.map(({ value, label: lbl, isNew }) => {
            const checked = selectedOccasions.includes(value);
            return (
              <label key={value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onOccasionChange?.(value)}
                  style={{ accentColor: "#111", width: 13, height: 13, cursor: "pointer" }}
                />
                <span style={{ fontSize: 12, color: "#444", flex: 1 }}>{lbl}</span>
                {isNew && (
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", backgroundColor: "#111",
                    color: "#fff", padding: "2px 5px",
                  }}>
                    nuevo
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* ── LIMPIAR ── */}
      {hasActive && (
        <button
          onClick={onClear}
          style={{
            marginTop: 24, background: "none", border: "none", padding: 0,
            fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em",
            color: "#9b9b97", cursor: "pointer", textDecoration: "underline",
            textUnderlineOffset: 3, textAlign: "left",
          }}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
