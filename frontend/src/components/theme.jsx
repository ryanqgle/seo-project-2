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
        },
        charcoal: {
          bg: 'gray.800',
          color: 'white',
          _hover: { bg: 'gray.700' },
          _active: { bg: 'gray.900' },
          _dark: {
            bg: 'gray.200',
            color: 'black',
            _hover: { bg: 'gray.300' },
            _active: { bg: 'gray.400' },
          },
        },
        danger: {
          bg: 'red.500',
          color: 'white',
          _hover: { bg: 'red.600' },
          _active: { bg: 'red.700' },
          _dark: {
            bg: 'red.500',
            color: 'white',
            _hover: { bg: 'red.600' },
            _active: { bg: 'red.700' },
          },
        },
        dangerSoft: {
          bg: 'red.50',
          color: 'red.700',
          border: '1px solid',
          borderColor: 'red.200',
          _hover: {
            bg: 'red.100',
          },
          _active: {
            bg: 'red.200',
          },
          _dark: {
            bg: 'red.900',
            color: 'red.100',
            borderColor: 'red.700',
            _hover: {
              bg: 'red.800',
            },
            _active: {
              bg: 'red.700',
            },
          },
        },
        infoSoft: {
          bg: 'blue.50',
          color: 'blue.700',
          border: '1px solid',
          borderColor: 'blue.200',
          _hover: {
            bg: 'blue.100',
          },
          _active: {
            bg: 'blue.200',
          },
          _dark: {
            bg: 'blue.900',
            color: 'blue.100',
            borderColor: 'blue.700',
            _hover: {
              bg: 'blue.800',
            },
            _active: {
              bg: 'blue.700',
            },
          },
        },
        neutralSoft: {
          bg: 'gray.100',
          color: 'gray.800',
          border: '1px solid',
          borderColor: 'gray.300',
          _hover: {
            bg: 'gray.200',
          },
          _active: {
            bg: 'gray.300',
          },
          _dark: {
            bg: 'gray.700',
            color: 'white',
            borderColor: 'gray.600',
            _hover: {
              bg: 'gray.600',
            },
            _active: {
              bg: 'gray.500',
            },
          },
        },
      },
      defaultProps: {
        variant: 'solid',
      },
    },
    Card: {
      baseStyle: (props) => {
        const { colorScheme: c } = props

        if (c && c !== 'gray') {
          return {
            container: {
              boxShadow: 'none',
              border: '1px solid',
              borderColor: `${c}.200`,
              borderRadius: '2xl',
              bg: `${c}.50`,
              _dark: {
                bg: `${c}.900`,
                borderColor: `${c}.700`,
              },
            },
          }
        }

        return {
          container: {
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'gray.200',
            borderRadius: '2xl',
            bg: 'white',
            _dark: {
              bg: 'gray.800',
              borderColor: 'gray.700',
            },
          },
        }
      },
      variants: {
        passenger: {
          container: {
            bg: 'blue.50',
            border: '1px solid',
            borderColor: 'blue.200',
            borderRadius: 'xl',
            boxShadow: 'none',
            _dark: {
              bg: 'blue.900',
              borderColor: 'blue.700',
            },
          },
        },
        driver: {
          container: {
            bg: 'blue.50',
            border: '1px solid',
            borderColor: 'blue.300',
            borderRadius: 'xl',
            boxShadow: 'none',
            _dark: {
              bg: 'blue.900',
              borderColor: 'blue.700',
            },
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
        subtle: (props) => {
          const { colorScheme: c } = props

          if (c && c !== 'gray') {
            return {
              bg: `${c}.100`,
              color: `${c}.800`,
              _dark: {
                bg: `${c}.900`,
                color: `${c}.100`,
              },
            }
          }

          return {
            bg: 'gray.100',
            color: 'black',
            _dark: {
              bg: 'gray.700',
              color: 'white',
            },
          }
        },
      },
    },
  },
})

export default theme