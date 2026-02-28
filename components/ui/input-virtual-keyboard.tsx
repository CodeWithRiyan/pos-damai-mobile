import { useState } from "react";
import { Grid, GridItem } from "./grid";
import { Heading } from "./heading";
import { Pressable } from "./pressable";
import { SolarIconLinear } from "./solar-icon-wrapper";

export default function InputVirtualKeyboard({
  nominal = "0",
  totalAmount = "0",
  onChange,
}: {
  nominal?: string;
  totalAmount?: string;
  onChange?: (value: string) => void;
}) {
  const [useShortcut, setUseShortcut] = useState<boolean>(false);
  if (useShortcut) {
    return (
      <Grid _extra={{ className: "grid-cols-2" }} gap={8} className="p-4">
        <GridItem _extra={{ className: "col-span-1" }}>
          <Pressable
            className="h-16 w-full items-center justify-center bg-primary-100 active:bg-primary-200"
            onPress={() => onChange?.(totalAmount)}
          >
            <Heading size="lg" className="text-primary-500 font-bold">
              UANG PAS
            </Heading>
          </Pressable>
        </GridItem>
        <GridItem _extra={{ className: "col-span-1" }}>
          <Pressable
            className="h-16 w-full items-center justify-center active:bg-background-100"
            onPress={() => onChange?.("10000")}
          >
            <Heading size="xl" className="font-bold">
              10.000
            </Heading>
          </Pressable>
        </GridItem>
        <GridItem _extra={{ className: "col-span-1" }}>
          <Pressable
            className="h-16 w-full items-center justify-center active:bg-background-100"
            onPress={() => onChange?.("20000")}
          >
            <Heading size="xl" className="font-bold">
              20.000
            </Heading>
          </Pressable>
        </GridItem>
        <GridItem _extra={{ className: "col-span-1" }}>
          <Pressable
            className="h-16 w-full items-center justify-center active:bg-background-100"
            onPress={() => onChange?.("50000")}
          >
            <Heading size="xl" className="font-bold">
              50.000
            </Heading>
          </Pressable>
        </GridItem>
        <GridItem _extra={{ className: "col-span-1" }}>
          <Pressable
            className="h-16 w-full items-center justify-center active:bg-background-100"
            onPress={() => onChange?.("100000")}
          >
            <Heading size="xl" className="font-bold">
              100.000
            </Heading>
          </Pressable>
        </GridItem>
        <GridItem _extra={{ className: "col-span-1" }}>
          <Pressable
            className="h-16 w-full items-center justify-center active:bg-background-100"
            onPress={() => onChange?.("150000")}
          >
            <Heading size="xl" className="font-bold">
              150.000
            </Heading>
          </Pressable>
        </GridItem>
        <GridItem _extra={{ className: "col-span-1" }}>
          <Pressable
            className="h-16 w-full items-center justify-center active:bg-background-100"
            onPress={() => onChange?.("200000")}
          >
            <Heading size="xl" className="font-bold">
              200.000
            </Heading>
          </Pressable>
        </GridItem>
        <GridItem _extra={{ className: "col-span-1" }}>
          <Pressable
            className="h-16 w-full flex-row gap-4 items-center justify-center active:bg-background-100"
            onPress={() => setUseShortcut(false)}
          >
            <SolarIconLinear name="Keyboard" size={32} color="#3d2117" />
            <Heading
              size="lg"
              className="text-primary-500 font-bold leading-[100%]"
            >
              MANUAL
            </Heading>
          </Pressable>
        </GridItem>
      </Grid>
    );
  }
  return (
    <Grid _extra={{ className: "grid-cols-4" }}>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "7")}
        >
          <Heading size="3xl" className="font-bold">
            7
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "8")}
        >
          <Heading size="3xl" className="font-bold">
            8
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "9")}
        >
          <Heading size="3xl" className="font-bold">
            9
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.("")}
        >
          <Heading size="3xl" className="font-bold">
            C
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "4")}
        >
          <Heading size="3xl" className="font-bold">
            4
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "5")}
        >
          <Heading size="3xl" className="font-bold">
            5
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "6")}
        >
          <Heading size="3xl" className="font-bold">
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
          <Heading size="3xl" className="font-bold">
            1
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "2")}
        >
          <Heading size="3xl" className="font-bold">
            2
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "3")}
        >
          <Heading size="3xl" className="font-bold">
            3
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => setUseShortcut(true)}
        >
          <SolarIconLinear name="Banknote" size={32} color="#3d2117" />
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "0")}
        >
          <Heading size="3xl" className="font-bold">
            0
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + "000")}
        >
          <Heading size="3xl" className="font-bold">
            000
          </Heading>
        </Pressable>
      </GridItem>
      <GridItem _extra={{ className: "col-span-1" }}>
        <Pressable
          className="h-20 w-full items-center justify-center active:bg-background-100"
          onPress={() => onChange?.(nominal + ".")}
        >
          <Heading size="3xl" className="font-bold">
            .
          </Heading>
        </Pressable>
      </GridItem>
    </Grid>
  );
}
