# Claude Agent Guide for arohaislove.github.io

## Repository Overview

This is a GitHub Pages repository that hosts a portfolio of projects. The site is automatically built and deployed by GitHub Pages using static HTML/CSS/JavaScript files.

**Live URL:** https://arohaislove.github.io

## Repository Structure

```
arohaislove.github.io/
├── index.html              # Main landing page with links to all projects
├── CLAUDE.md              # This file - guide for Claude agents
├── project-name-1/        # Individual project folder
│   ├── index.html         # Project main page
│   ├── styles.css         # Project styles
│   ├── script.js          # Project scripts
│   └── ...                # Other project assets
├── project-name-2/        # Another project folder
│   └── ...
└── ...
```

## How GitHub Pages Works

- **No Build Step Required:** GitHub Pages serves static files directly. Any HTML/CSS/JS files you push will be immediately available.
- **URL Structure:**
  - Main page: `https://arohaislove.github.io/`
  - Projects: `https://arohaislove.github.io/project-name/`
- **Auto-Deploy:** Changes pushed to the main branch are automatically deployed (usually within 1-2 minutes).

## Instructions for New Claude Agents

When you're assigned to work on this repository, follow these steps:

### Step 1: Read Existing Projects

Before creating anything new, **thoroughly review what already exists**:

1. **Read the main index.html** to see all current projects
2. **List all project folders** in the repository
3. **Read through existing project files** to understand:
   - What each project does
   - Its current state (complete, in-progress, experimental)
   - Its structure and dependencies

```bash
# Commands to help you explore
ls -la                           # List all folders
cat index.html                   # Read main index
ls -la project-name/             # List files in a project
cat project-name/index.html      # Read project page
```

### Step 2: Determine Where Your Work Belongs

Ask yourself:

- **Does this enhance/fix an existing project?** → Add to that project's folder
- **Is this a completely new concept/tool/demo?** → Create a new project
- **Is this a variation of an existing project?** → Consider if it should be:
  - A feature within the existing project, OR
  - A separate project with a descriptive name (e.g., "calculator-v2", "calculator-advanced")

**When in doubt:** Ask the user whether to extend an existing project or create a new one.

### Step 3: Adding to an Existing Project

If you're enhancing an existing project:

1. **Navigate to the project folder**
2. **Read all existing files** to understand the current implementation
3. **Make your changes** while maintaining consistency with existing code style
4. **Test that you haven't broken existing functionality**
5. **Update the project's documentation** if you add new features
6. **Commit with a clear message** describing what you changed

```bash
# Example workflow
cd project-name/
# Make your changes
git add .
git commit -m "Add feature X to project-name"
git push -u origin claude/branch-name
```

### Step 4: Creating a New Project

If you're creating a completely new project:

#### 4.1: Create the Project Folder and Files

```bash
# Create project folder (use kebab-case naming)
mkdir project-name/

# Create basic project structure
touch project-name/index.html
touch project-name/styles.css
touch project-name/script.js
```

#### 4.2: Set Up the Project Files

Create a proper `index.html` with:
- Proper HTML5 structure
- Descriptive title
- Link to styles.css
- Link to script.js (if needed)
- Clear description of what the project does
- Link back to main index

**Minimal template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Name - Aroha's Projects</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <nav>
        <a href="/">← Back to Projects</a>
    </nav>

    <main>
        <h1>Project Name</h1>
        <p>Description of what this project does...</p>

        <!-- Your project content here -->
    </main>

    <script src="script.js"></script>
</body>
</html>
```

#### 4.3: Update the Main Index Page

**This is critical!** Add a link to your new project in `/index.html`:

1. Read the current index.html
2. Add your project to the list in a consistent format
3. Include:
   - Project name
   - Brief description
   - Link to the project folder

#### 4.4: Commit and Push

```bash
git add .
git commit -m "Add new project: project-name"
git push -u origin claude/branch-name
```

## Best Practices

### Naming Conventions

- **Project folders:** Use kebab-case (e.g., `todo-app`, `color-picker`, `physics-simulator`)
- **Files:** Use lowercase with appropriate extensions (e.g., `index.html`, `styles.css`, `utils.js`)
- **Be descriptive:** Names should clearly indicate what the project does

### Code Organization

- **Keep projects self-contained:** Each project folder should have everything it needs
- **Shared resources:** If multiple projects need the same resource, consider:
  - Creating a `/shared/` or `/common/` folder at the root
  - Or duplicating small resources to keep projects independent
- **Documentation:** Include comments in complex code, especially in JavaScript

### Styling

- **Responsive design:** Always consider mobile users
- **Consistent look:** While each project can have its own style, maintain some consistency
- **Accessibility:** Use semantic HTML, proper contrast, and ARIA labels where appropriate

### Testing

Before pushing:
1. **Check your HTML** is valid (use a validator or browser dev tools)
2. **Test in browser** if possible (or describe what should be tested)
3. **Check links** to ensure they work correctly
4. **Verify responsive behavior** at different screen sizes

## Git Workflow

- **Branch naming:** Use the branch specified in your task (usually `claude/something`)
- **Commit messages:** Be descriptive about what changed and why
- **Push when done:** Always push your completed work to the designated branch
- **Never push to main directly:** Always use your assigned branch

### Creating Pull Requests - DIRECT LINK METHOD

After you push your commits, use this **DIRECT LINK** format to create a pull request:

```
https://github.com/arohaislove/arohaislove.github.io/compare/main...BRANCH_NAME?expand=1
```

**Replace `BRANCH_NAME` with your actual branch name.** For example:
```
https://github.com/arohaislove/arohaislove.github.io/compare/main...claude/chromesthesia-watercolor-app-wFgPS?expand=1
```

**This is the RECOMMENDED method** - it directly opens the PR creation page with your branch pre-selected.

#### Alternative: Yellow Banner Method

If you prefer, you can also:

1. **Go to the main repository page:**
   ```
   https://github.com/arohaislove/arohaislove.github.io
   ```

2. **GitHub may show a yellow banner** at the top saying:
   - "Your recently pushed branches: claude/branch-name (X minutes ago)"
   - With a green **"Compare & pull request"** button

3. **Click that button** if it appears

**Note:** The banner doesn't always appear, especially after the first PR or after some time has passed. The direct link method above is more reliable.

### Handling Follow-Up Changes After a PR is Merged

**Scenario:** You merged a PR, then realized you need to make more changes to the same feature.

**THE SIMPLE SOLUTION:**

1. **Just push your new commits to the SAME branch** you were already using:
   ```bash
   # Make your changes to files
   git add .
   git commit -m "Your commit message"
   git push
   ```

2. **Then go to the main repo page:**
   ```
   https://github.com/arohaislove/arohaislove.github.io
   ```

3. **GitHub will show the yellow banner again** with the "Compare & pull request" button

4. **Click it to create a NEW pull request** with your additional changes

**Why this works:**
- Your branch still exists even after the PR is merged
- New commits to that branch can create a new PR
- GitHub automatically detects new commits and shows the banner
- This is much simpler than creating new branches for small follow-ups

**Alternative (if branch was deleted):**
If the branch was deleted after merge, you'll need to create a new branch:
```bash
# Create and switch to a new branch
git checkout -b claude/feature-name-v2-XXXXX
git push -u origin claude/feature-name-v2-XXXXX
```

Then follow the same steps above.

## Common Tasks

### Add a simple HTML/CSS/JS project
1. Create folder: `mkdir project-name/`
2. Create files: `index.html`, `styles.css`, `script.js`
3. Update main `index.html` with link
4. Commit and push

### Add a complex project with multiple pages
1. Create folder with subdirectories as needed
2. Ensure `project-name/index.html` is the entry point
3. Organize assets in subfolders (e.g., `images/`, `lib/`, `data/`)
4. Update main `index.html` with link
5. Commit and push

### Update existing project
1. Read existing files first
2. Make changes
3. Test that nothing broke
4. Commit with clear description
5. Push

## Troubleshooting

- **Changes not showing on live site?** Wait 2-3 minutes for GitHub Pages to rebuild
- **404 error?** Check that folder names and file names match exactly (case-sensitive)
- **Styles not loading?** Verify the path in `<link>` tag is correct
- **JavaScript not working?** Check browser console for errors

## Questions to Ask Yourself

Before you start working:
- [ ] Have I read through all existing projects?
- [ ] Do I understand what already exists?
- [ ] Is this a new project or an addition to an existing one?
- [ ] Have I read the main index.html?
- [ ] Do I know where my changes should go?

Before you commit:
- [ ] Did I update the main index.html (if new project)?
- [ ] Did I test the changes?
- [ ] Are my file/folder names appropriate?
- [ ] Is the code documented?
- [ ] Did I create a clear commit message?

## Need Help?

If you're unsure about anything:
1. **Read existing code** for patterns and conventions
2. **Ask the user** for clarification
3. **When in doubt, keep it simple** - working code is better than perfect code

---

**Remember:** This is a portfolio site. Every project should be something worth showing off. Take pride in your work, keep it clean, and make it functional!
