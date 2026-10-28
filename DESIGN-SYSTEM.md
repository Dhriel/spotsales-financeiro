# 🎨 SpotSales — Design System

Documento de referência do sistema de design do SpotSales, para copiar e adaptar em outros projetos.

## Stack & filosofia

- **React + Vite + Tailwind CSS** (tudo via utility classes, sem CSS escrito à mão)
- Estilo: **dashboard SaaS roxo/violeta**, clean, com muito espaço em branco, cantos arredondados generosos, sombras suaves e micro-animações.
- Fonte: **Inter** (300–800) para tudo, com Manrope reservada para headlines.
- Easing padrão: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out suave, tipo Apple).

---

## 1. Paleta de cores (o coração da identidade)

A marca toda gira em torno do **roxo/violeta** (`brand`).

```js
brand: {
  50:  '#F5F3FF',  // fundo de página / hover suave
  100: '#EDE9FE',  // bordas, divisórias
  200: '#DDD6FE',  // rings, barras de gráfico "previsto"
  300: '#C4B5FD',  // scrollbar
  400: '#A78BFA',
  500: '#8B5CF6',
  600: '#7C3AED',  // ★ cor principal (navbar, gráficos)
  700: '#6D28D9',  // ★ botões, ícones, texto destaque
  800: '#5B21B6',  // gradiente escuro
  900: '#4C1D95',
  950: '#1E1B4B',  // títulos (quase preto-azulado)
}
```

### Cores semânticas de status

Padrão fixo: **tom-50 de fundo + tom-700 de texto + tom-200 de borda**.

| Status | Cor |
|---|---|
| Pago / sucesso | Verde esmeralda (`emerald`) |
| Pendente | Âmbar (`amber`) |
| Atrasado / erro | Vermelho (`red`) |
| Enviado / info | Azul (`blue`) |
| Cancelado / inativo | Cinza (`gray`) |

> 💡 O segredo do visual coeso: **uma cor de marca dominante** + cinzas neutros pro texto + cores semânticas só nos status.

---

## 2. CSS global (`src/index.css`)

Só 3 coisas além do Tailwind:

### Antialiasing + scrollbar fina personalizada

```css
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #C4B5FD; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #A78BFA; }
```

### Classes de componente reutilizáveis (o "kit" que dá consistência)

```css
@layer components {
  .card {
    @apply bg-white rounded-xl shadow-sm border border-brand-100/50 p-6;
  }

  .btn-primary {
    @apply bg-brand-700 hover:bg-brand-800 text-white font-medium px-4 py-2
           rounded-lg transition-all duration-200 shadow-sm hover:shadow-md;
  }

  .btn-secondary {
    @apply bg-white hover:bg-brand-50 text-brand-700 font-medium px-4 py-2
           rounded-lg transition-all duration-200 border border-brand-200;
  }

  /* Badges de status — pílula arredondada */
  .badge-pago {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
           font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200;
  }
  .badge-pendente {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
           font-semibold bg-amber-50 text-amber-700 border border-amber-200;
  }
  .badge-atrasado {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
           font-semibold bg-red-50 text-red-700 border border-red-200;
  }
  .badge-cancelado {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
           font-semibold bg-gray-50 text-gray-500 border border-gray-200;
  }
  .badge-enviado {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
           font-semibold bg-blue-50 text-blue-700 border border-blue-200;
  }
}
```

---

## 3. Animações (`tailwind.config.js`)

O que dá o "polish". Todas usam o easing `cubic-bezier(0.16, 1, 0.3, 1)`:

```js
keyframes: {
  'fade-in-up':    { '0%': { opacity: '0', transform: 'translateY(12px)' },  '100%': { opacity: '1', transform: 'translateY(0)' } },
  'fade-in':       { '0%': { opacity: '0' },                                  '100%': { opacity: '1' } },
  'fade-in-right': { '0%': { opacity: '0', transform: 'translateX(-12px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
  'fade-in-down':  { '0%': { opacity: '0', transform: 'translateY(-12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
  'scale-in':      { '0%': { opacity: '0', transform: 'scale(0.96) translateY(12px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
},
animation: {
  'fade-in-up':    'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  'fade-in':       'fade-in 0.3s ease-out forwards',
  'fade-in-right': 'fade-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  'fade-in-down':  'fade-in-down 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  'scale-in':      'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
}
```

| Animação | Uso |
|---|---|
| `animate-fade-in-up` | entra de baixo (12px) com fade — listas, cards |
| `animate-fade-in` | só opacidade — overlays |
| `animate-fade-in-right` | entra da esquerda |
| `animate-fade-in-down` | entra de cima |
| `animate-scale-in` | escala 0.96→1 + sobe — modais (efeito "pop") |

---

## 4. Padrões de UI que se repetem

### Navbar fixa com gradiente roxo

```jsx
<nav className="fixed top-0 left-0 right-0 z-50 h-16"
     style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
```

Logo + nome + subtítulo em `uppercase tracking-widest`, badge "Online" com bolinha verde pulsante (`animate-pulse`), avatar circular.

### Sidebar colapsável

`w-60` → `w-[68px]`. Item ativo ganha:

```
bg-brand-700 text-white shadow-md shadow-brand-700/25
```

Submenus com borda lateral `border-l-2 border-brand-200`.

### Stat cards (o padrão mais bonito)

- Grid responsivo: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`
- Ícone num quadrado colorido (`bg-*-50`) que faz `group-hover:scale-110`
- Label em `text-[11px] uppercase tracking-wider text-gray-500`
- Valor em `font-bold text-brand-950`
- Cards clicáveis ganham `ring-1 ring-brand-200 hover:ring-brand-400`

```jsx
<div className="card hover:shadow-md transition-shadow group cursor-pointer
                ring-1 ring-brand-200 hover:ring-brand-400">
  <div className="p-2 rounded-lg bg-brand-50 group-hover:scale-110 transition-transform">
    <Icon size={18} className="text-brand-700" />
  </div>
  <div className="mt-3">
    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Label</p>
    <p className="font-bold text-brand-950 mt-0.5 text-lg sm:text-2xl">Valor</p>
  </div>
</div>
```

### Modais

```jsx
{/* Overlay */}
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" />
{/* Caixa */}
<div className="rounded-2xl shadow-2xl border border-brand-100/50 animate-scale-in">
  {/* Header com gradiente roxo bem sutil (opacidade 08) */}
  <div style={{ background: 'linear-gradient(135deg, #7C3AED08, #5B21B608)' }}>
```

### Badges de status (pílula com bolinha)

```jsx
<span className="badge-pago">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
  Pago
</span>
```

### Gráficos (Recharts) — identidade consistente

- Grid tracejado roxo claro `#E9D5FF`, sem linhas de eixo (`axisLine={false} tickLine={false}`)
- Barras com cantos arredondados no topo: `radius={[6, 6, 0, 0]}`
- Tooltips com `borderRadius: 12px` + sombra suave
- "Previsto" em roxo claro `#DDD6FE`, "Recebido" em roxo forte `#7C3AED`

```jsx
<Tooltip contentStyle={{
  borderRadius: '12px',
  border: '1px solid #E9D5FF',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
}} />
```

---

## 📋 Receita resumida pra replicar o estilo

| Elemento | Valor |
|---|---|
| Cor primária | `#7C3AED` / `#6D28D9` |
| Fundo de página | `#F5F3FF` (brand-50) |
| Títulos | `text-brand-950` bold |
| Texto secundário | `text-gray-500` |
| Raios de borda | cards `rounded-xl`, modais `rounded-2xl`, botões/pílulas `rounded-lg` / `rounded-full` |
| Sombras | `shadow-sm` padrão, `shadow-md` no hover |
| Bordas | `border-brand-100/50` (roxo translúcido) |
| Fonte | Inter |
| Easing | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Transições | `transition-all duration-200` |

**A "fórmula" do visual:** fundo roxo bem claro → cards brancos com borda roxa translúcida → uma cor de marca forte usada com parcimônia → cinzas neutros pro texto → cores semânticas só em status → micro-animações de hover (scale, ring, shadow) → tudo arredondado.

---

## Setup mínimo num projeto novo

1. **`index.html`** — importar Inter:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
   <body class="bg-brand-50 font-sans antialiased">
   ```

2. **`tailwind.config.js`** — colar `colors.brand`, `fontFamily.sans: ['Inter', ...]`, e os blocos `keyframes` / `animation` acima.

3. **`src/index.css`** — colar o `@layer base` (scrollbar) e `@layer components` (`.card`, `.btn-*`, `.badge-*`).

Pronto — qualquer página nova já nasce com a identidade visual.
