package com.example.demo.models;

import java.io.Serializable;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "fotos_imoveis")
@Getter 
@Setter 


public class FotoImovelModel implements Serializable{
    private static final long serialVersionUID = 1L;

    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Integer id;
    private String nomeArquivo;
    private String caminho;
    private Boolean capa;
    private Integer ordem;

    @ManyToOne 
    @JoinColumn (name = "imovel_id", nullable = false)
    private ImovelModel imovel;

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((id == null) ? 0 : id.hashCode());
        result = prime * result + ((nomeArquivo == null) ? 0 : nomeArquivo.hashCode());
        result = prime * result + ((caminho == null) ? 0 : caminho.hashCode());
        result = prime * result + ((capa == null) ? 0 : capa.hashCode());
        result = prime * result + ((ordem == null) ? 0 : ordem.hashCode());
        result = prime * result + ((imovel == null) ? 0 : imovel.hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        FotoImovelModel other = (FotoImovelModel) obj;
        if (id == null) {
            if (other.id != null)
                return false;
        } else if (!id.equals(other.id))
            return false;
        if (nomeArquivo == null) {
            if (other.nomeArquivo != null)
                return false;
        } else if (!nomeArquivo.equals(other.nomeArquivo))
            return false;
        if (caminho == null) {
            if (other.caminho != null)
                return false;
        } else if (!caminho.equals(other.caminho))
            return false;
        if (capa == null) {
            if (other.capa != null)
                return false;
        } else if (!capa.equals(other.capa))
            return false;
        if (ordem == null) {
            if (other.ordem != null)
                return false;
        } else if (!ordem.equals(other.ordem))
            return false;
        if (imovel == null) {
            if (other.imovel != null)
                return false;
        } else if (!imovel.equals(other.imovel))
            return false;
        return true;
    }

  
    

}
