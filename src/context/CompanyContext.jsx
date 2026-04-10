import { createContext, useContext, useEffect, useState } from "react";
import { KEYS } from "../utils/storageKeys";
import storage from "../utils/storage";

const CompanyContext = createContext();

function createDefaultCompany() {
    return { name: "", members: [] };
}

export const CompanyProvider = ({ children }) => {
    const [company, setCompany] = useState(() => {
        try {
            const stored = storage.getItem(KEYS.company);
            return stored ? JSON.parse(stored) : createDefaultCompany();
        } catch { return createDefaultCompany(); }
    });

    useEffect(() => { storage.setItem(KEYS.company, JSON.stringify(company)); }, [company]);

    function setCompanyName(name) {
        setCompany(prev => ({ ...prev, name }));
    }

    function addMember(pseudo) {
        const member = { id: crypto.randomUUID(), pseudo, activeCharacter: null, charIcon: null, retiredCharacters: [] };
        setCompany(prev => ({ ...prev, members: [...prev.members, member] }));
        return member.id;
    }

    function updateMemberPseudo(id, pseudo) {
        setCompany(prev => ({
            ...prev,
            members: prev.members.map(m => m.id === id ? { ...m, pseudo } : m),
        }));
    }

    function setMemberCharacter(id, characterName) {
        setCompany(prev => ({
            ...prev,
            members: prev.members.map(m => m.id === id ? { ...m, activeCharacter: characterName || null } : m),
        }));
    }

    function setMemberCharIcon(id, iconId) {
        setCompany(prev => ({
            ...prev,
            members: prev.members.map(m => m.id === id ? { ...m, charIcon: iconId || null } : m),
        }));
    }

    function retireMemberCharacter(id, newCharacterName, newCharIcon) {
        setCompany(prev => ({
            ...prev,
            members: prev.members.map(m => {
                if (m.id !== id) return m;
                const retired = m.activeCharacter
                    ? [...m.retiredCharacters, { name: m.activeCharacter, charIcon: m.charIcon ?? null, retiredAt: new Date().toISOString() }]
                    : m.retiredCharacters;
                return { ...m, activeCharacter: newCharacterName || null, charIcon: newCharIcon || null, retiredCharacters: retired };
            }),
        }));
    }

    function removeMember(id) {
        setCompany(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
    }

    function resetCompany() {
        setCompany(createDefaultCompany());
    }

    return (
        <CompanyContext.Provider value={{
            company,
            setCompanyName, addMember, updateMemberPseudo,
            setMemberCharacter, setMemberCharIcon,
            retireMemberCharacter, removeMember,
            resetCompany,
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => useContext(CompanyContext);
