import { CaretProvider } from "../../core/webview/CaretProvider";

export class CaretProviderTestHelper {
    private caretProvider: CaretProvider;

    constructor(caretProviderInstance: CaretProvider) {
        this.caretProvider = caretProviderInstance;
    }

    /**
     * Helper method to call the protected forTest_loadEnvironmentVariables method for testing.
     */
    public async callLoadEnvironmentVariables(): Promise<Record<string, string>> {
        // CARET MODIFICATION: Directly calling the protected method for testing purposes.
        return (this.caretProvider as any).forTest_loadEnvironmentVariables();
    }

    /**
     * Helper method to call the public login method for testing.
     */
    public async callLogin(): Promise<void> {
        // CARET MODIFICATION: Directly calling the public login method for testing purposes.
        return this.caretProvider.login();
    }
}
