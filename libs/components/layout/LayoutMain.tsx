import { Box, Stack } from "@mui/material"
import { ComponentType } from "react"
import styles from "@/scss/components/layout/LayoutMain.module.scss"



const LayoutMain = (Component: ComponentType) => {
    return (
        <Stack className={styles.layoutMain}>
            <Box component={'div'} id="bunker" sx={{ flexGrow: 1 }}>
                {/*@ts-ignore*/}
                <Component {...props} setSnackbar={setSnackbar} setTitle={setTitle} />
            </Box>
        </Stack>
    )
}

export default LayoutMain   