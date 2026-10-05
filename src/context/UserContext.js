import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [profile, setProfile] = useState(null); // { name, phone }
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("profile");
      if (raw) setProfile(JSON.parse(raw));
      setLoaded(true);
    })();
  }, []);

  const saveProfile = async (next) => {
    setProfile(next);
    await AsyncStorage.setItem("profile", JSON.stringify(next));
  };

  return (
    <UserContext.Provider value={{ profile, saveProfile, loaded }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
