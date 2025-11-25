# `react-emoji-kit`

[![npm version](https://img.shields.io/npm/v/react-emoji-kit)](https://www.npmjs.com/package/react-emoji-kit)
[![npm downloads](https://img.shields.io/npm/dw/react-emoji-kit)](https://www.npmjs.com/package/react-emoji-kit)
[![License](https://img.shields.io/npm/l/react-emoji-kit)](LICENSE) <br>
![Browser Support](https://img.shields.io/badge/browser-Chrome%20%7C%20Firefox%20%7C%20Safari%20%7C%20Edge-brightgreen)

---

## Description

**react-emoji-kit** is a modern, light weight and high-performance emoji picker for React apps.  
Built for speed, zero dependencies, optimized rendering, category-based navigation, recent emoji memory, and ultra-smooth animations.  
Perfect for chat apps, social platforms, forms, or any UI needing a clean emoji selection experience.

## Features

- **Ultra-fast and lightweight** – Minimal bundle size, zero dependencies, optimized for performance.  
- **Dark mode support** – Can integrate with your project’s global theme for seamless light/dark mode experience.  
- **Smart positioning** – Automatically adjusts the emoji picker position based on available viewport space.  
- **Customizable label/button** – Show your own React node as the trigger.  
- **Recent emoji memory** – Tracks recently used emojis for quick access.  
- **Category-based navigation** – Easy navigation across emoji categories.  
- **Smooth animations** – Quick, responsive, and visually appealing transitions.  
- **Flexible API** – Supports `onEmojiClick` callback or `inputRef` for automatic emoji insertion.  
- **Size variants** – Two size options (`Regular` and `Small`) to fit different UI requirements.  
- **Zero setup required** – CSS is automatically injected; no manual imports needed.  
- **TypeScript ready** – Fully typed for safety and autocompletion in editors.  
- **Compatible with React projects** – Works seamlessly with CRA, Vite, Next.js, and more.  

## Demo

![Emoji Picker Demo](./demo/demo.gif)

## Installation

Using npm: 
```bash
npm install react-emoji-kit
```
Using yarn:
```bash
yarn add react-emoji-kit
```

## Usage

### 1️⃣ Using `onEmojiClick` callback

This is the standard way to get the clicked emoji and handle it in your state:

```tsx
import EmojiPicker from "./EmojiPicker";

export const App = () => {
  return (
    <EmojiPicker onEmojiClick={(emoji) => {
        // 'emoji' contains the clicked emoji
        // use it to set the desired state
    }} />
  );
};
```

### 2️⃣ Using `inputRef` to inject emoji directly

If you want the clicked emoji to automatically appear in a text input, you can use inputRef:

```tsx
import EmojiPicker from "./EmojiPicker";

export const App = () => {
  const inpRef = useRef(null);
  return (
    <div>
      <EmojiPicker inputRef={inpRef} />
      <input type="text" ref={inpRef} />
    </div>
  );
};
```
#### Note:

>The inputRef prop must be attached to an `<input>` or `<textarea>` element. <br />
>Clicking an emoji will automatically insert it at the cursor position in the input field.

## Props


| Prop  | Type | Description | Default |
| ------------- |:-------------:| :-----------:| :---------:|
| onEmojiClick      | `(emoji: string) => void `    | Callback fired when a user clicks an emoji. Receives the clicked emoji. | - |
| inputRef     | ` React.RefObject<HtmlInputElement \| HTMLTextAreaElement> ` | Ref to an `<input>` or `<textarea>` element. Clicking an emoji inserts it automatically at the cursor position. | - |
| label      | `React.ReactNode `    | Content or button shown to the user. If not provided, a smile svg will appear. | ![icon](https://res.cloudinary.com/djwpcqv3o/image/upload/w_20/v1764047070/svgviewer-png-output_usi7js.png) | 
| dark | `boolean` | Enables dark mode styling. When true, the picker adapts to dark mode. You can also pass your global theme state here to sync with your app theme. | `false` |
| size | `'Regular'` \| `'Small'` | Controls the size of the **emoji picker**. Has two variants: 'Regular' (default) and 'Small'. | `'Regular'`| 
| showOnMobile | `boolean` | Controls whether the emoji picker is **visible on mobile devices.** Most mobile keyboards have a built-in emoji picker, so by default the component is hidden.Set this to **true to override and show the picker on mobile.**| `false` |

#### Note for Mobile Devices

On most modern mobile devices (iOS and Android), the emoji picker will automatically be **hidden**.  
This is because mobile keyboards already provide a **built-in emoji picker**, making a custom picker redundant.  

Hiding the picker on mobile:  

- Avoids unnecessary UI clutter on small screens.  
- Provides a smoother user experience by preventing conflicts with the keyboard.  
- Saves resources by not rendering components that won’t be used.  

> ⚠️ Tip: If you want the picker to appear on mobile for any reason, you could implement an override prop like `showOnMobile={true}`.


## License
[![License](https://img.shields.io/npm/l/react-emoji-kit)](LICENSE)
