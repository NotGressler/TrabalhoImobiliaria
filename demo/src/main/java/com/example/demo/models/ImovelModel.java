package com.example.demo.models;

import java.io.Serializable;
import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "imoveis")
@Getter
@Setter
public class ImovelModel implements Serializable{
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String titulo;
   
    @Column(columnDefinition = "text")
    private String descricao;

    @Column(name = "preco_venda", precision = 15, scale = 2)
    private BigDecimal precoVenda;

    @Column(name = "preco_aluguel", precision = 15, scale = 2) 
    private BigDecimal precoAluguel;

    private String finalidade; 

    private String status;

    private Integer dormitorios;

    private Integer banheiros;

    private Integer garagem;

    @Column(name = "area_total", precision = 15, scale = 2)
    private BigDecimal areaTotal;

    @Column(name = "area_construida", precision = 15, scale = 2)
    private BigDecimal areaConstruida;

    // Endereço
    private String endereco;
    private String numero;
    private String complemento;
    private String cep;

    @Column(columnDefinition = "text")
    private String caracteristicas;

    private Boolean destaque;

    @JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_imovel_id")
    private TipoImovelModel tipoImovel;


    @JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bairro_id")
    private BairroModel bairro;


    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((id == null) ? 0 : id.hashCode());
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
        ImovelModel other = (ImovelModel) obj;
        if (id == null) {
            if (other.id != null)
                return false;
        } else if (!id.equals(other.id))
            return false;
        return true;
    }

}