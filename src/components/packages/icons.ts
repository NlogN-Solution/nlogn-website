import {
  Bot,
  Code2,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  Palette,
  Search,
  Server,
  Target,
  Video,
} from "lucide-react";
import type { PackageFamily } from "@/config/packages";

export const familyIcons: Record<PackageFamily["icon"], LucideIcon> = {
  megaphone: Megaphone,
  search: Search,
  code: Code2,
  server: Server,
  bot: Bot,
  message: MessageSquare,
  video: Video,
  target: Target,
  palette: Palette,
};
