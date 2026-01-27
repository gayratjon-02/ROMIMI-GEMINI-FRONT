import { Stack, Box } from "@mui/material";
import FolderIcon from '@mui/icons-material/Folder';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import DownloadIcon from '@mui/icons-material/Download';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import styles from "@/scss/styles/HomePage/HomeTop.module.scss";

// Note: Ensure Next.js allows importing SCSS modules from this path. 
// If generic import style is preferred, we might need to adjust based on user config.
// Assuming standart Create Next App SCSS module behavior.

const HomeTop = () => {
    return (
        <Stack className={styles.container}>
            {/* Left: Navigation & Context */}
            <div className={styles.leftSection}>
                {/* Tab Group */}
                <div className={styles.tabGroup}>
                    <button className={`${styles.tab} ${styles.active}`}>Product Visuals</button>
                    <button className={styles.tab}>Ad Recreation</button>
                </div>

                {/* Dropdown Context */}
                <div className={styles.dropdown}>
                    <FolderIcon fontSize="small" />
                    <span>SS26</span>
                    <ArrowDropDownIcon fontSize="small" />
                </div>
            </div>

            {/* Center: Status Indicator */}
            <div className={styles.centerSection}>
                <div className={styles.statusPill}>
                    <span className={styles.statusDot}></span>
                    Generating 4/6...
                </div>
            </div>

            {/* Right: Actions */}
            <div className={styles.rightSection}>
                <div className={`${styles.iconButton} ${styles.highlight}`}>
                    <WbSunnyIcon fontSize="small" />
                </div>
                <div className={styles.iconButton}>
                    <ViewStreamIcon fontSize="small" />
                </div>
                <div className={styles.iconButton}>
                    <DownloadIcon fontSize="small" />
                </div>
                <div className={styles.iconButton}>
                    <AccountCircleIcon fontSize="small" />
                </div>
            </div>
        </Stack>
    )
}

export default HomeTop;