
import { resolveClinicConfig, resolveProtocol } from "../lib/protocol-resolver";
import { getInterlasikMedications } from "../constants/protocols";

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`✅ ${message}`);
}

async function verify() {
    console.log("Starting verification...");

    // 1. Default Behavior
    const defaultConfig = resolveClinicConfig(undefined);
    assert(defaultConfig.id === "default", "Default config ID is 'default'");
    const defaultMeds = resolveProtocol(defaultConfig, "INTERLASIK" as any, 1000); // 16+ hours awake
    assert(defaultMeds.length > 0, "Default protocol returns meds");
    assert(defaultMeds[0].notes === "", "Default Sterodex has empty notes");

    // 2. Ein Tal (Standard)
    const einTalConfig = resolveClinicConfig("ein-tal");
    assert(einTalConfig.id === "ein-tal", "Ein Tal config ID is 'ein-tal'");
    const einTalMeds = resolveProtocol(einTalConfig, "INTERLASIK" as any, 1000);
    assert(einTalMeds.length > 0, "Ein Tal protocol returns meds");
    assert(einTalMeds[0].notes === "", "Ein Tal uses default protocol (empty notes)");

    // 3. Demo Clinic (Override)
    const demoConfig = resolveClinicConfig("demo-clinic");
    assert(demoConfig.id === "demo-clinic", "Demo config ID is 'demo-clinic'");
    const demoMeds = resolveProtocol(demoConfig, "INTERLASIK" as any, 1000);
    assert(demoMeds.length > 0, "Demo protocol returns meds");
    assert(!!demoMeds[0].notes?.includes("DEMO OVERRIDE"), "Demo protocol has override note");

    console.log("All verifications passed!");
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});
