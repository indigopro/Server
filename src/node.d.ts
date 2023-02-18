import { Host } from "./host";

declare module '*.json' {
    const value: any;
    export default value;
}

declare global {
    var host: Host;
}

export { };