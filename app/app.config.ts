export default defineAppConfig({
    ui: {
      colors: {
        primary: 'orange'
      },
      input: {
        slots: {
          root: 'w-full',

        },
        defaultVariants: {
          size: 'xl'
        }
      },
      selectMenu: {
        slots: {
          root: 'w-full',
        },
        defaultVariants: {
          size: 'xl'
        }
      },
      textarea: {
        slots: {
          root: 'w-full',
        },
        defaultVariants: {
          size: 'xl'
        }
      },
      checkbox: {
        defaultVariants: {
          size: 'xl'
        }
      },
      button: {
        defaultVariants: {
          size: 'xl'
        }
      },
      formField: {
        defaultVariants: {
          size: 'xl'
        }
      },
      modal: {
        slots: {
          content: 'overflow-y-scroll'
        }
      }
    },
  });