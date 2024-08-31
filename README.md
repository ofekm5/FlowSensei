# FlowSensei

<p align="center">
  <img src="FlowSensei.png" alt="Logo" width="200"/>
</p>

FlowSensei is a SaaS solution that leverages RouterOS (Linux-based OS for routers) to maintain vital network traffic during periods of high demand. By adjusting transport based on real-time conditions and predefined policies, FlowSensei ensures the smooth operation of critical network services and activities.

## Features

- **Real-Time Monitoring:** The system continuously routes internet packets into the ELK stack, storing and presenting meaningful transport data to the user.
- **Flexible Policy Configuration:** Users can define and modify service priorities to their specific requirements.
- **Critical Service Protection:** Ensuring uninterrupted operation of prioritized services during high-demand situations.

### How It Works

FlowSensei employs a microservices architecture and software-defined routers, which can be flexibly configured via an API. The system initializes a priority queue for each new router, containing predefined common services, with options to add or remove services as needed.

#### Defining Services

When defining a service, users provide the following parameters:

- **Necessary Parameters:**
  - `service`: The name of the service.
  - `protocol`: The protocol to match (e.g., TCP, UDP).
  - `dstPort`: The destination port to match (one or a range).

- **Optional Parameters:**
  - `srcAddress`: The source address to match.
  - `dstAddress`: The destination address to match.
  - `srcPort`: The source port to match (one or a range).

The router optimizes network performance during high-demand periods by utilizing real-time monitoring and prioritizing traffic based on the priority queue. FlowSensei is designed as a web app for managing multiple routers globally, not as an SDN implementation—meaning each router operates independently of the others.

### RabbitMQ Integration

In FlowSensei, each microservice has a corresponding queue, and data is routed to these queues using exchanges in RabbitMQ:

- **Exchange:** `requests_exchange` is the only exchange, responsible for handling RouterOS API calls.
- **Queue Handling:** Results are returned to the appropriate queues using the `msg.properties.replyTo` feature with a message ID.

#### Message Formats (JSON-Formatted)

- **Login Message:**
  ```json
  {
    "type": "login",
    "username": "<username>",
    "password": "<password>",
    "publicIp": "<public_ip>",
    "routerID": "<router_id>"
  }
  ```

- **Connection Mark:**
  ```json
  {
    "type": "connection-mark",
    "chain": "prerouting",
    "connectionMark": "<service_name>",
    "protocol": "<protocol>",
    "dstPort": "<comma_separated_ports>",
    "passthrough": "yes"
  }
  ```

- **Packet Mark:**
  ```json
  {
    "type": "packet-mark",
    "chain": "prerouting",
    "connectionMark": "<connection_mark>",
    "packetMark": "<connection_mark>packet",
    "passthrough": "no"
  }
  ```

- **Update Node Priority:**
  ```json
  {
    "type": "update-node-priority",
    "name": "<service_name>",
    "newPriority": "<new_priority>"
  }
  ```

- **Logout:**
  ```json
  {
    "type": "logout"
  }
  ```

### Monitoring Traffic

FlowSensei leverages Kibana dashboards to provide real-time insights into your network's traffic. You can visualize protocol distribution, top source and destination addresses, and overall network health.

### Managing Traffic Policies

Use the Controller API to define and manage traffic prioritization rules based on your organization's needs. The RouterClient enforces these rules on the network devices.
