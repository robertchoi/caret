# JSON File Commenting Conventions for Caret

**Important:** Standard JSON does not support comments. The following conventions are for internal documentation and tracking Caret-specific changes, particularly in shared files like `cline/webview-ui/package.json`. These comments might need to be stripped or handled by a pre-processor before final JSON parsing if they cause issues with linters or build processes.

## Single-Line Comments

Use `//` followed by a concise marker and description.
- **Marker:** `[CARET]`
- **Format:** `// [CARET] Your concise comment here`

**Example (within a `package.json` context):**
```json
{
  "dependencies": {
    "some-dependency": "^1.0.0", // [CARET] Reason for this dependency.
    "another-dependency": "^2.1.0"
  }
}
```

## Multi-Line Comment Blocks

Use start and end markers for more extensive comments that span multiple lines or group related items.
- **Start Marker:** `// [CARET_BLOCK_START] Optional short description for the block`
- **Content:** Each line of the multi-line comment should also start with `//`
- **End Marker:** `// [CARET_BLOCK_END] Optional short description (can match start)`

**Example (within a `package.json` context):**
```json
{
  "dependencies": {
    // [CARET_BLOCK_START] Internationalization Dependencies
    // These packages are essential for providing multi-language support
    // within the Caret WelcomeView and other future UI components.
    "i18next": "^23.11.5",         // [CARET] Core i18n library.
    "react-i18next": "^15.5.3",    // [CARET] React bindings for i18next.
    // [CARET_BLOCK_END] Internationalization Dependencies
    "other-package": "1.0.0"
  }
}
```

## Single-Line Comments for Key-Value Pairs

To comment on a specific key-value pair, add a new key-value pair immediately **after** the target item.
- **Comment Key Format:** `comment_[originalKeyName]_caret` (if related to Caret) or `comment_[originalKeyName]`
- **Comment Value:** The descriptive comment string.

**Example:**
```json
{
  "someSetting": true,
  "comment_someSetting_caret": "Enabled for Caret's enhanced feature X."
}
```

## Comment Blocks

To define a descriptive block for a group of settings:
- **Start Block Key:** `_comment_block_start_[description]_caret`
  - Value: Comment text for the start of the block.
- **End Block Key:** `_comment_block_end_[description]_caret`
  - Value: Comment text for the end of the block (can be simple like "End of ... block.").

**Example:**
```json
{
  "_comment_block_start_feature_Y_settings_caret": "Settings related to Caret's Feature Y.",
  "settingA": "valueA",
  "comment_settingA_caret": "Specific to Feature Y.",
  "settingB": false,
  "comment_settingB_caret": "Disabled by default for Feature Y.",
  "_comment_block_end_feature_Y_settings_caret": "End of settings for Caret's Feature Y."
}
```

Always ensure these comment keys are unique and do not conflict with actual configuration keys. 