import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

export default tseslint.config({
  plugins: {
    "@stylistic": stylistic
  },
  files: [
    "lib/*.{js,ts}",
    "test/*.{js,ts}",
  ],
  extends: [
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname
        }
      }
    }
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "@stylistic/semi": "error",
    "@stylistic/no-extra-semi": "error",
    "@stylistic/member-delimiter-style": "error",
  }
});
