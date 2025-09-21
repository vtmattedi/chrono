import  { createContext, useContext, useState, type ReactNode } from 'react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Alert {
    message: ReactNode;
    title: ReactNode;
    onResult?: (result: boolean) => void;

}

interface AlertContextProps {
    alert: Alert | null;
    showAlert: (message: ReactNode, title: ReactNode, onResult?: (result: boolean) => void) => void;
    clearAlert: () => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [alert, setAlert] = useState<Alert | null>(null);
    const [alertVisible, setAlertVisible] = useState<boolean>(false);
    const showAlert = (title: ReactNode, message: ReactNode, onResult?: (result: boolean) => void) => {
        setAlert({ message, title, onResult });
        setAlertVisible(true);
    };

    const clearAlert = () => {
        setAlert(null);
        setAlertVisible(false);
    };
   
    return (

        <AlertContext.Provider value={{ alert, showAlert, clearAlert }}>
            {children}
            <AlertDialog open={alertVisible} onOpenChange={(open) => {
                if (!open) {
                    clearAlert();
                }
            }} >
                <AlertDialogContent >
                    <AlertDialogHeader>
                        <AlertDialogTitle className='font-lato'> {alert?.title}</AlertDialogTitle>
                        <AlertDialogDescription asChild className='font-inter'>
                            {alert?.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className={'bg-red-500 dark:bg-[#8D0000] text-white'} onClick={() => {
                            if (alert?.onResult) {
                                alert?.onResult?.(false);
                            }
                            setAlertVisible(false);
                        }}>OK</AlertDialogCancel>
                        {/* <AlertDialogAction onClick={() => {
                            alert?.onResult?.(true);
                        }} >OK</AlertDialogAction> */}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AlertContext.Provider>
    );
};