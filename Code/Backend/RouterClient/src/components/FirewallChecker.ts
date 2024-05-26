import apiClient from "./APIClient";
import logger from "../logger";

interface CheckFirewallMessage {
    type: "check_firewall";
}

const checkFirewall = async (command: CheckFirewallMessage) => {
    await apiClient.connect().then();
    const allFirewallRules = await apiClient.write('/ip/firewall/filter/print');
    logger.info(allFirewallRules.toString());
    await apiClient.close();
}

export default checkFirewall;
