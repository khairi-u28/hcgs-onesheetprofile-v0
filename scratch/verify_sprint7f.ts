import fs from "fs";
import path from "path";
import * as layoutConfig from "../src/lib/ui/layout-config";

function runVerification() {
  console.log("=== STARTING SPRINT 7F AUTOMATED VERIFICATION ===");
  let failures = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      failures++;
    }
  };

  // 1. Verify Layout configuration exports and default preset values
  console.log("\n--- Checking presets and types ---");
  assert(!!layoutConfig.UI_LAYOUT_PRESETS, "UI_LAYOUT_PRESETS is exported");
  assert(layoutConfig.UI_LAYOUT_PRESETS.layoutMode === "compact", "Default layoutMode is 'compact'");
  assert(layoutConfig.UI_LAYOUT_PRESETS.spacingDensity === "auto", "Default spacingDensity is 'auto' (automatic adaptation)");
  assert(layoutConfig.UI_LAYOUT_PRESETS.sidebarMode === "compact", "Default sidebarMode is 'compact'");

  // 2. Verify sidebar widths presets
  console.log("\n--- Checking sidebar widths ---");
  const collapsedWidths = layoutConfig.getSidebarWidths(true);
  const expandedWidths = layoutConfig.getSidebarWidths(false);
  
  assert(collapsedWidths.current === "60px", "Collapsed width is 60px under compact mode");
  assert(expandedWidths.current === "240px", "Expanded width is 240px under compact mode");
  
  // 3. Verify helper functions return valid class strings
  console.log("\n--- Checking layout helpers output ---");
  
  const mainContentClasses = layoutConfig.getMainContentClasses();
  assert(typeof mainContentClasses === "string" && mainContentClasses.includes("responsive-container"), "getMainContentClasses returns correct container class");
  
  const cardHeaderClasses = layoutConfig.getCardHeaderClasses();
  assert(typeof cardHeaderClasses === "string" && cardHeaderClasses.includes("responsive-card-header"), "getCardHeaderClasses returns base style");

  const cardContentClasses = layoutConfig.getCardContentClasses();
  assert(typeof cardContentClasses === "string" && cardContentClasses.includes("responsive-card-content"), "getCardContentClasses returns base style");
  
  const tableThClasses = layoutConfig.getTableThClasses();
  assert(typeof tableThClasses === "string" && tableThClasses.includes("responsive-table-cell"), "getTableThClasses returns base style");
  
  const tableTdClasses = layoutConfig.getTableTdClasses();
  assert(typeof tableTdClasses === "string" && tableTdClasses.includes("responsive-table-cell"), "getTableTdClasses returns base style");

  const stickyClasses = layoutConfig.getSidebarStickyClasses();
  assert(typeof stickyClasses === "string" && stickyClasses.includes("sticky") && stickyClasses.includes("z-30"), "getSidebarStickyClasses returns sticky position and higher z-index");

  // 4. Verify no circular imports exist (static file analysis check)
  console.log("\n--- Checking for circular dependencies ---");
  const layoutFilePath = path.join(__dirname, "../src/lib/ui/layout-config.ts");
  const layoutContent = fs.readFileSync(layoutFilePath, "utf8");
  const hasImportFromViewsOrShell = /import.*(portal-shell|view|views)/.test(layoutContent);
  assert(!hasImportFromViewsOrShell, "layout-config.ts does not import from views or shell layouts (no circular dependency)");

  console.log(`\n=== VERIFICATION FINISHED with ${failures} failures ===`);
  process.exit(failures > 0 ? 1 : 0);
}

runVerification();
