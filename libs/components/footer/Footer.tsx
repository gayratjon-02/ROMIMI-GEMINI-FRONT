import { Box, Stack } from "@mui/material"
import { ComponentType } from "react"
import styles from "@/scss/components/footer/Footer.module.scss"


const Footer = (Component: ComponentType) => {
    return (
        <Stack className={styles.footerMain}>
            <Box component={'div'}>
                Footer
            </Box>

        </Stack>
    )
}

export default Footer   