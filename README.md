# SpriteLab

The Ultimate Custom Icon Library for React

## What's the Best Way to Use Icons in Your React Project?

There are many approaches to using icons in React projects, each with its own pros and cons. Let's explore some of the common methods:

### React Icons and Other Libraries

Libraries like React Icons, Material Icons, and Ant Icons are popular and easy to use. They offer thousands of icons readily available as React components. However, a downside of this approach is that these libraries can be quite heavy, increasing the bundle size—a common problem with React Icons.

### Using SVG Images Directly

You can also use SVG images directly with the `<img>` tag. This approach is straightforward and eliminates the need for a heavy library. However, it lacks the flexibility and customizability of a dedicated icon library.

### SVG Components

Since SVGs are markup just like HTML, you can use them directly in JSX. This makes the icons highly customizable. However, this approach can be challenging to maintain. Imagine having hundreds of React components in your project just for icons. Adding or removing icons would require significant refactoring and manual work.

### SVG Sprites

An optimized approach is to use an SVG sprite, which is a single SVG file containing multiple icons. Libraries like Feather Icons and Lucide Icons provide this option. All the icons are compiled into one file, making it convenient. However, there are two main issues with static sprites:

1. You might not need all the icons in the library, but you still have to load the entire sprite.
2. Adding custom icons or icons from different libraries requires manual editing of the sprite.

### How Is SpriteLab Different?

SpriteLab takes the SVG sprite approach a step further. It allows you to create and maintain custom sprites from the terminal without installing any packages. With a few commands, you can have a custom icon library ready. You can add icons to your library using just the URL to the SVG file or the path to an SVG file on your device. SpriteLab automatically creates sprites and a React component that allows you to use any icon from your library with extreme flexibility.

## Installation

You don't have to install the package. Just run:

```sh
npx spritelab init
```

This will prompt you with a series of questions about how you’d like to set up your library. Once done, the following files will be created in your repo:

1. **spritelab.config.json**: The configuration file that defines the paths to the sprites, React component, and the component name.
2. **An SVG file**: Stored in the folder you chose. Your icons will be added to this file.
3. **A React component**: Stored in the folder you chose. This component will be used to render the icons.

All the above files are generated automatically and do not require manual editing.

Once the initialization is complete, proceed to add icons to the library.

```sh
npx spritelab add --name bell-fill --icon 'D:\\Downloads\\icons\\bell-fill.svg'
```

This will add the `bell-fill` icon to the library.

### How to Use It

```tsx
// The component name is Icon by default.
// Use the icon name that you chose.
<Icon icon="default/bell-fill" />
```

The component accepts all props that an SVG element accepts, making it highly customizable:

```tsx
<Icon icon="default/bell-fill" strokeWidth={2} width={32} height={32} />
```

To use any icon, make use of the `icon` prop in the component. It uses the `sprite-name/icon-name` naming convention. If you are using TypeScript, you get autocomplete for this prop, making your life easier.

## Commands

### `init`

Initialize the icon library by answering a few questions. This will create a sprite file, a React component.

**Options**

- `-y, --yes`: Skip the questions and use the default values.

**Example**

```sh
npx spritelab init
```

### `create`

Create a new sprite.

**Options**

- `-n, --name <name>`: Name of the sprite to be created.

**Example**

```sh
npx spritelab create --name notifications
```

### `add`

Add an icon to a sprite.

**Options**

- `-n, --name <name>`: Name of the icon to be added.
- `-i, --icon <icon>`: URL or file path of the SVG icon to be added. Enclose the URL or file path in single or double quotes.
- `-s, --sprite [sprite]`: Name of the sprite to add the icon to. If not provided, the icon will be added to the default sprite.

**Examples**

```sh
npx spritelab add --name bell-fill --icon 'D:\\Downloads\\icons\\bell-fill.svg'
```

```sh
npx spritelab add --name bell-fill --icon 'https://api.iconify.design/bi/bell-fill.svg' --sprite notifications
```

### `remove`

Remove an icon from a sprite.

**Options**

- `-n, --name <name>`: Name of the icon to be removed.
- `-s, --sprite [sprite]`: Name of the sprite to remove the icon from. If not provided, the icon will be removed from the default sprite if it exists.

**Example**

```sh
npx spritelab remove --name bell-fill --sprite notifications
```

### `delete`

Delete a sprite.

**Options**

- `-n, --name <name>`: Name of the sprite to be deleted. If not provided, the default sprite will be deleted.

**Example**

```sh
npx spritelab delete --name notifications
```

## Optimizations

### Lazy Loading

For small projects, the default configuration should be sufficient. You can add icons to the default sprite, and it should work fine.

For larger projects, where there might be hundreds or thousands of icons, adding all of them to a single SVG sprite can be inefficient. The sprite itself would be huge, impacting the initial page load.

To optimize, split icons into separate sprites based on their usage—similar to code-splitting in JavaScript. For example, you can load a sprite only when it’s needed, such as when a specific user action occurs.

#### Example:

Let’s say the `bell-fill` icon is used only for notifications. First, create a new sprite:

```sh
npx spritelab create --name notifications
```

Next, add the `bell-fill` icon to the `notifications` sprite:

```sh
npx spritelab add --name bell-fill --icon 'D:\\Downloads\\icons\\bell-fill.svg' --sprite notifications
```

Remove the `bell-fill` icon from the default sprite:

```sh
npx spritelab remove --name bell-fill --sprite default
```

Use the `bell-fill` icon from the `notifications` sprite:

```tsx
<Icon icon="notifications/bell-fill" />
```

Internally, every sprite is a separate SVG file. A sprite is only loaded when it is used in the HTML document.

### Caching

Browsers often implement aggressive caching, which can cause issues when icons are added or removed from a sprite. To address this, every time a change is made to the library, the icon component is updated with a version identifier. This ensures that the browser fetches the latest version of the sprite.

## Contributions

Feel free to suggest changes or new ideas. Raise issues if you find any bugs. If you wish to contribute by writing code, make the changes and raise a PR to the `master` branch. PR guidelines are not yet set up, so please cooperate accordingly.
