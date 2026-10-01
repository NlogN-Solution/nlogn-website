/**
 * ISO 3166-1 alpha-3 to alpha-2.
 *
 * Search Console reports countries as alpha-3 ("npl", "gbr"); `Intl.DisplayNames`
 * accepts only alpha-2. Truncating the three-letter code is the obvious shortcut
 * and it is wrong often enough to matter: "aut" would render as Australia rather
 * than Austria, and "chn" as Switzerland rather than China.
 *
 * Packed as fixed five-character records (three in, two out) rather than an
 * object literal — the same 249 entries in a fraction of the lines, parsed once
 * on first use.
 */

const PACKED =
  "afgAFalaAXalbALdzaDZasmASandADagoAOaiaAIataAQatgAGargARarmAMabwAWausAUautAT" +
  "azeAZbhsBSbhrBHbgdBDbrbBBblrBYbelBEblzBZbenBJbmuBMbtnBTbolBObesBQbihBAbwaBW" +
  "bvtBVbraBRiotIObrnBNbgrBGbfaBFbdiBIcpvCVkhmKHcmrCMcanCAcymKYcafCFtcdTDchlCL" +
  "chnCNcxrCXcckCCcolCOcomKMcogCGcodCDcokCKcriCRcivCIhrvHRcubCUcuwCWcypCYczeCZ" +
  "dnkDKdjiDJdmaDMdomDOecuECegyEGslvSVgnqGQeriERestEEswzSZethETflkFKfroFOfjiFJ" +
  "finFIfraFRgufGFpyfPFatfTFgabGAgmbGMgeoGEdeuDEghaGHgibGIgrcGRgrlGLgrdGDglpGP" +
  "gumGUgtmGTggyGGginGNgnbGWguyGYhtiHThmdHMvatVAhndHNhkgHKhunHUislISindINidnID" +
  "irnIRirqIQirlIEimnIMisrILitaITjamJMjpnJPjeyJEjorJOkazKZkenKEkirKIprkKPkorKR" +
  "kwtKWkgzKGlaoLAlvaLVlbnLBlsoLSlbrLRlbyLYlieLIltuLTluxLUmacMOmdgMGmwiMWmysMY" +
  "mdvMVmliMLmltMTmhlMHmtqMQmrtMRmusMUmytYTmexMXfsmFMmdaMDmcoMCmngMNmneMEmsrMS" +
  "marMAmozMZmmrMMnamNAnruNRnplNPnldNLnclNCnzlNZnicNInerNEngaNGniuNUnfkNFmkdMK" +
  "mnpMPnorNOomnOMpakPKplwPWpsePSpanPApngPGpryPYperPEphlPHpcnPNpolPLprtPTpriPR" +
  "qatQAreuRErouROrusRUrwaRWblmBLshnSHknaKNlcaLCmafMFspmPMvctVCwsmWSsmrSMstpST" +
  "sauSAsenSNsrbRSsycSCsleSLsgpSGsxmSXsvkSKsvnSIslbSBsomSOzafZAsgsGSssdSSespES" +
  "lkaLKsdnSDsurSRsjmSJsweSEcheCHsyrSYtwnTWtjkTJtzaTZthaTHtlsTLtgoTGtklTKtonTO" +
  "ttoTTtunTNturTRtkmTMtcaTCtuvTVugaUGukrUAareAEgbrGBusaUSumiUMuryUYuzbUZvutVU" +
  "venVEvnmVNvgbVGvirVIwlfWFeshEHyemYEzmbZMzweZW";

let table: Map<string, string> | null = null;

function lookup(): Map<string, string> {
  if (table) return table;

  table = new Map();
  for (let index = 0; index < PACKED.length; index += 5) {
    table.set(PACKED.slice(index, index + 3), PACKED.slice(index + 3, index + 5));
  }
  return table;
}

/** Falls back to the uppercased code — Search Console also emits "zzz" for unknown. */
export function countryName(alpha3: string): string {
  const alpha2 = lookup().get(alpha3.toLowerCase());
  if (!alpha2) return alpha3.toUpperCase();

  try {
    return new Intl.DisplayNames(["en-GB"], { type: "region" }).of(alpha2) ?? alpha2;
  } catch {
    return alpha2;
  }
}
