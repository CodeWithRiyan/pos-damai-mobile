import { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionIcon,
  AccordionItem,
  AccordionTitleText,
  AccordionTrigger,
  ChevronDownIcon,
  ChevronUpIcon,
} from "./ui";

export default function FilterAccordion({
  title = "Filter",
  children,
  isExpanded,
  onToggle,
}: {
  title?: string;
  children: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  return (
    <Accordion
      size="md"
      variant="filled"
      type="single"
      isCollapsible={true}
      isDisabled={false}
      className="flex-0 w-full"
      value={isExpanded ? ["a"] : []}
      onValueChange={(val) => onToggle?.()}
    >
      <AccordionItem value="a">
        <AccordionHeader>
          <AccordionTrigger className="py-1 px-0">
            {({ isExpanded: ie }: { isExpanded: boolean }) => (
              <>
                <AccordionTitleText>{title}</AccordionTitleText>
                {ie ? (
                  <AccordionIcon as={ChevronUpIcon} className="ml-3" />
                ) : (
                  <AccordionIcon as={ChevronDownIcon} className="ml-3" />
                )}
              </>
            )}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent className="px-0">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
