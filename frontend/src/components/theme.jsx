import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.900',
        _dark: {
          bg: 'gray.900',
          color: 'gray.50',
        },
      },
    },
  },
  components: {
    Heading: {
      baseStyle: {
        color: 'gray.900',
        _dark: {
          color: 'white',
        },
      },
    },
    // force standard text to turn off-white in dark mode
    Text: {
      baseStyle: {
        color: 'gray.800',
        _dark: {
          color: 'gray.100',
        },
      },
    },
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'full',
      },
      variants: {
        solid: {
          bg: 'black',
          color: 'white',
          _hover: { bg: 'gray.800' },
          _active: { bg: 'gray.700' },
          _dark: {
            bg: 'white', // buttons become white in dark mode
            color: 'black',
            _hover: { bg: 'gray.200' },
            _active: { bg: 'gray.300' },
          },
        },
        outline: {
          borderColor: 'gray.300',
          color: 'black',
          _hover: { bg: 'gray.100' },
          _dark: {
            borderColor: 'gray.600',
            color: 'white',
            _hover: { bg: 'gray.800' },
          },
        },
        ghost: {
          color: 'black',
          _hover: { bg: 'gray.100' },
          _dark: {
            color: 'white',
            _hover: { bg: 'gray.800' },
          },
        }
      },
      defaultProps: {
        variant: 'solid',
      },
    },
    Card: {
      baseStyle: {
        container: {
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'gray.200',
          borderRadius: '2xl',
          bg: 'white',
          _dark: {
            bg: 'gray.800', // cards turn dark gray
            borderColor: 'gray.700',
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderRadius: 'xl',
            bg: 'gray.50',
            borderColor: 'gray.200',
            _dark: {
              bg: 'gray.800',
              borderColor: 'gray.600',
            },
            _focus: {
              borderColor: 'black',
              boxShadow: '0 0 0 1px black',
              _dark: {
                borderColor: 'white',
                boxShadow: '0 0 0 1px white',
              },
            },
          },
        },
      },
    },
    Select: {
      variants: {
        outline: {
          field: {
            borderRadius: 'xl',
            bg: 'gray.50',
            borderColor: 'gray.200',
            _dark: {
              bg: 'gray.800', // matches dark mode cards
              borderColor: 'gray.600',
              color: 'white', // makes the dropdown text white
            },
            _focus: {
              borderColor: 'black',
              boxShadow: '0 0 0 1px black',
              _dark: {
                borderColor: 'white',
                boxShadow: '0 0 0 1px white',
              },
            },
          },
          icon: {
            _dark: {
              color: 'white', // makes the dropdown arrow visible
            }
          }
        },
      },
    },
    Tabs: {
      variants: {
        line: {
          tab: {
            fontWeight: "semibold",
            color: "gray.500", // fixes the blueish unselected tab tint
            _selected: {
              color: "black",
              borderColor: "black",
              _dark: {
                color: "white",
                borderColor: "white",
              }
            },
            _active: {
              bg: "transparent",
            },
            _dark: {
              color: "gray.400",
            }
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'md',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        px: 2,
        py: 0.5,
      },
      variants: {
        subtle: {
          bg: 'gray.100',
          color: 'black',
          _dark: {
            bg: 'gray.700',
            color: 'white',
          }
        }
      }
    }
  },
})

export default theme