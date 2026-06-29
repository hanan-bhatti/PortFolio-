import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface SlashCommandOptions {
  onTrigger?: (position: { top: number; left: number } | null) => void;
}

export const SlashCommandExtension = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      onTrigger: undefined,
    };
  },

  addProseMirrorPlugins() {
    const { onTrigger } = this.options;
    
    return [
      new Plugin({
        key: new PluginKey("slash_command_listener"),
        props: {
          handleKeyDown(view, event) {
            if (event.key === "/") {
              // Wait for character to be committed to get correct coords
              setTimeout(() => {
                const { state } = view;
                const { from } = state.selection;
                try {
                  const coords = view.coordsAtPos(from);
                  if (onTrigger) {
                    onTrigger({
                      top: coords.top + 24,
                      left: coords.left,
                    });
                  }
                } catch (e) {
                  console.error(e);
                }
              }, 10);
            } else if (event.key === "Escape" || event.key === "Enter") {
              // If Esc or Enter happens, we dismiss the slash popup elsewhere
            }
            return false;
          },
        },
      }),
    ];
  },
});

export default SlashCommandExtension;
