import { Grid, GridItem } from "./grid";
import { Heading } from "./heading";
import { Pressable } from "./pressable";
import { SolarIconLinear } from "./solar-icon-wrapper";

export default function InputVirtualKeyboard({
  nominal,
  onChange,
}: {
  nominal?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <Grid _extra={{ className: "grid-cols-4" }}>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "7")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            7
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "8")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            8
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "9")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            9
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.("")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            C
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "4")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            4
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "5")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            5
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "6")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            6
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal?.slice(0, -1) || "")}
        >
          <SolarIconLinear name="Backspace" size={32} color="#3d2117" />
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "1")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            1
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "2")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            2
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "3")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            3
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }} />
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "0")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            0
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "000")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            000
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + ".")}
        >
          <Heading size="3xl" className="font-bold mb-2">
            .
          </Heading>
        </Pressable>
      </GridItem>
    </Grid>
  );
}
